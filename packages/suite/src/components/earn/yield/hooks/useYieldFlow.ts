import { useCallback, useEffect, useMemo, useRef } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';

import { type TranslationKey } from '@suite/intl';
import { openModal } from '@suite/modal';
import { type EarnParams } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';
import { useCurrentRef } from '@trezor/react-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { useResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { useYieldPendingTransactionTracking } from './useYieldPendingTransactionTracking';
import type {
    UseYieldFlowStepsResult,
    YieldApproveModalState,
    YieldFlowDisplayToken,
    YieldFlowFormValues,
    YieldFlowStepId,
    YieldFlowToken,
    YieldFlowType,
    YieldPendingTransactionState,
} from '../types';
import {
    getBulletListItemStates,
    getYieldModifyAmountInput,
    isAmountGreaterThan,
} from '../yieldFlowUtils';
import { selectYieldSession, yieldActions } from '../yieldReducer';
import {
    handleYieldApproveCancelThunk,
    handleYieldApproveSuccessTxidThunk,
    submitYieldActionThunk,
    submitYieldApproveThunk,
    submitYieldRevokeThunk,
} from '../yieldThunks';

type UseYieldFlowProps = {
    account: Account;
    routeParams: EarnParams;
    flowType: YieldFlowType;
};

export type UseYieldFlowResult = {
    account: Account;
    vault: ReturnType<typeof useResolvedYieldFlowData>['vault'];
    token: YieldFlowToken | null;
    receiptToken: YieldFlowDisplayToken | null;
    apy: number | null;
    suppliedAmount: string;
    flowKey: string;
    maxAmount: string;
    liveAmount: string;
    approvedAmount: string | null;
    actionAmount: string | null;
    completedAmount: string;
    completedReceiptAmount: string;
    errorMessage: TranslationKey | undefined;
    approveModalState: YieldApproveModalState | null;
    pendingTransaction: YieldPendingTransactionState | null;
    isModifyMode: boolean;
    lastApprovedAmount: string;
    isRevokeRequired: boolean;
    isAmountEmpty: boolean;
    isAmountTooHigh: boolean;
    isApprovalInsufficient: boolean;
    isSubmittingApprove: boolean;
    isSubmittingAction: boolean;
    setAmountInput: (amount: string) => void;
    submitApprove: () => void;
    submitAction: () => void;
    submitRevoke: () => void;
    enterModifyApproval: () => void;
    handleApproveModalCancel: () => Promise<void>;
    handleApproveSuccessTxid: (txid: string) => void;
    openPendingTransaction: (txid: string) => void;
    methods: UseFormReturn<YieldFlowFormValues>;
    flow: UseYieldFlowStepsResult;
};

/** Context value type shared by both supply and withdraw — non-null token/receiptToken/vault. */
export type YieldFlowContextValues = Omit<
    UseYieldFlowResult,
    'token' | 'receiptToken' | 'vault'
> & {
    token: YieldFlowToken;
    receiptToken: YieldFlowDisplayToken;
    vault: NonNullable<UseYieldFlowResult['vault']>;
};

export const useYieldFlow = ({
    account,
    routeParams,
    flowType,
}: UseYieldFlowProps): UseYieldFlowResult => {
    const dispatch = useDispatch();
    const methods = useForm<YieldFlowFormValues>({
        defaultValues: {
            amountInput: '',
        },
    });
    const methodsRef = useCurrentRef(methods);

    const { vault, token, receiptToken, apy, suppliedAmount, flowKey } = useResolvedYieldFlowData({
        account,
        routeParams,
    });

    const session = useSelector(state => selectYieldSession(state, flowType, flowKey));

    const maxAmount = flowType === 'supply' ? (token?.balance ?? '') : suppliedAmount;

    useEffect(() => {
        if (!flowKey) {
            return;
        }

        dispatch(yieldActions.initSession({ flowType, flowKey }));
        dispatch(yieldActions.resetSession({ flowType, flowKey }));

        if (flowType === 'withdraw') {
            dispatch(yieldActions.skipApprovalStep({ flowType, flowKey }));
        }

        methodsRef.current.reset({ amountInput: '' });

        return () => {
            dispatch(yieldActions.disposeSession({ flowType, flowKey }));
        };
    }, [flowKey, flowType, dispatch, methodsRef]);

    useYieldPendingTransactionTracking({
        account,
        flowType,
        flowKey,
    });

    // Sync form value on step transitions driven by Redux (e.g. completeApproval, enterModifyMode from thunk)
    const prevStepRef = useRef<YieldFlowStepId | null>(null);

    useEffect(() => {
        const prevStep = prevStepRef.current;
        const nextStep = session.step;

        if (prevStep !== null && prevStep !== nextStep) {
            if (prevStep === 'approve' && nextStep === 'action') {
                methodsRef.current.reset({ amountInput: session.action.amount ?? '' });
            }

            if (prevStep === 'action' && nextStep === 'approve') {
                methodsRef.current.reset({
                    amountInput: getYieldModifyAmountInput({
                        liveAmount: methodsRef.current.getValues('amountInput'),
                        actionAmount: session.action.amount,
                        maxAmount,
                    }),
                });
            }
        }

        prevStepRef.current = nextStep;
    }, [session.step, session.action.amount, methodsRef, maxAmount]);

    const goToStep = useCallback(
        (step: YieldFlowStepId) => {
            dispatch(yieldActions.goToStep({ flowType, flowKey, step }));
        },
        [dispatch, flowKey, flowType],
    );

    const flow = useMemo(
        () => ({
            currentStep: session.step,
            stepStates: getBulletListItemStates(session.step),
            goToStep,
        }),
        [session.step, goToStep],
    );

    const openPendingTransaction = useCallback(
        (txid: string) => {
            dispatch(
                openModal({
                    type: 'transaction-detail',
                    txid,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    deviceState: account.deviceState,
                    flow: 'detail',
                }),
            );
        },
        [account, dispatch],
    );

    const enterModifyApproval = useCallback(() => {
        dispatch(yieldActions.enterModifyMode({ flowType, flowKey }));
    }, [dispatch, flowType, flowKey]);

    const setAmountInput = useCallback(
        (amount: string) => {
            methodsRef.current.setValue('amountInput', amount);
        },
        [methodsRef],
    );

    const submitApprove = useCallback(() => {
        if (!token || !receiptToken || !vault) {
            dispatch(
                yieldActions.setError({ flowType, flowKey, error: 'TR_EARN_YIELD_ERROR_GENERIC' }),
            );

            return;
        }

        const amount = methodsRef.current.getValues('amountInput');

        void dispatch(
            submitYieldApproveThunk({
                flowKey,
                flowType,
                flowData: { account, vault, token, receiptToken },
                amount,
            }),
        );
    }, [account, flowKey, flowType, receiptToken, dispatch, token, vault, methodsRef]);

    const submitRevoke = useCallback(() => {
        if (!token || !receiptToken || !vault) {
            dispatch(
                yieldActions.setError({ flowType, flowKey, error: 'TR_EARN_YIELD_ERROR_GENERIC' }),
            );

            return;
        }

        const amount = methodsRef.current.getValues('amountInput');

        void dispatch(
            submitYieldRevokeThunk({
                flowKey,
                flowType,
                flowData: { account, vault, token, receiptToken },
                amount,
            }),
        ).then(() => {
            methodsRef.current.reset({ amountInput: '' });
        });
    }, [account, flowKey, flowType, receiptToken, dispatch, token, vault, methodsRef]);

    const submitAction = useCallback(() => {
        if (!token || !receiptToken || !vault) {
            dispatch(
                yieldActions.setError({ flowType, flowKey, error: 'TR_EARN_YIELD_ERROR_GENERIC' }),
            );

            return;
        }

        const amount = methodsRef.current.getValues('amountInput');

        void dispatch(
            submitYieldActionThunk({
                flowKey,
                flowType,
                flowData: { account, vault, token, receiptToken },
                amount,
            }),
        );
    }, [account, flowKey, flowType, receiptToken, dispatch, token, vault, methodsRef]);

    const handleApproveModalCancel = useCallback(async () => {
        await dispatch(
            handleYieldApproveCancelThunk({
                flowKey,
                flowType,
            }),
        );
    }, [dispatch, flowKey, flowType]);

    const handleApproveSuccessTxid = useCallback(
        (txid: string) => {
            dispatch(handleYieldApproveSuccessTxidThunk({ flowType, flowKey, txid }));
        },
        [dispatch, flowKey, flowType],
    );

    const liveAmount = methods.watch('amountInput');

    const isAmountEmpty = !liveAmount;
    const isAmountTooHigh = isAmountGreaterThan({ amount: liveAmount, threshold: maxAmount });
    const isApprovalInsufficient =
        !session.approval.isModifyMode &&
        isAmountGreaterThan({
            amount: liveAmount,
            threshold: session.approval.amount ?? undefined,
        });

    return {
        account,
        vault,
        token,
        receiptToken,
        apy,
        suppliedAmount,
        flowKey,
        maxAmount,
        liveAmount,
        approvedAmount: session.approval.amount,
        actionAmount: session.action.amount,
        completedAmount: session.result.completedAmount,
        completedReceiptAmount: session.result.completedReceiptAmount,
        errorMessage: session.error ?? undefined,
        approveModalState: session.approval.modalState,
        pendingTransaction: session.action.pendingTransaction,
        isModifyMode: session.approval.isModifyMode,
        lastApprovedAmount: session.approval.lastApprovedAmount,
        isRevokeRequired: session.approval.isRevokeRequired,
        isAmountEmpty,
        isAmountTooHigh,
        isApprovalInsufficient,
        isSubmittingApprove:
            session.approval.isSubmitting ||
            session.approval.isPending ||
            session.approval.modalState !== null,
        isSubmittingAction: session.action.isSubmitting,
        setAmountInput,
        submitApprove,
        submitAction,
        submitRevoke,
        enterModifyApproval,
        handleApproveModalCancel,
        handleApproveSuccessTxid,
        openPendingTransaction,
        methods,
        flow,
    };
};
