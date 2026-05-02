import { useCallback, useEffect, useMemo, useRef } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';

import { type TranslationKey } from '@suite/intl';
import { openModal } from '@suite/modal';
import { type EarnParams } from '@suite/router';
import {
    type YieldActionFlowType,
    type StablecoinYieldAllowanceStatus,
    type YieldApproveModalState,
    type YieldFlowDisplayToken,
    type YieldFlowFormValues,
    type YieldFlowStepId,
    type YieldFlowToken,
    type YieldPendingTransactionState,
    handleYieldApproveCancelThunk,
    handleYieldApproveSuccessTxidThunk,
    initYieldAllowanceThunk,
    selectStablecoinYieldSession,
    stablecoinYieldActions,
    submitYieldApproveThunk,
    submitYieldRevokeThunk,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import type { BulletListItemState } from '@trezor/components';
import { useCurrentRef } from '@trezor/react-utils';

import { submitYieldActionThunk } from 'src/actions/wallet/stablecoinYieldSigningThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { useResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { useYieldPendingTransactionTracking } from './useYieldPendingTransactionTracking';
import {
    type YieldApprovalAction,
    getBulletListItemStates,
    getYieldApprovalAction,
    getYieldModifyAmountInput,
    isAmountGreaterThan,
} from '../yieldFlowUtils';

type UseYieldFlowProps = {
    account: Account;
    routeParams: EarnParams;
    flowType: YieldActionFlowType;
};

type UseYieldFlowStepsResult = {
    currentStep: YieldFlowStepId;
    stepStates: Record<YieldFlowStepId, BulletListItemState>;
    goToStep: (step: YieldFlowStepId) => void;
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
    actionAmount: string | null;
    completedAmount: string;
    completedReceiptAmount: string;
    errorMessage: TranslationKey | undefined;
    approveModalState: YieldApproveModalState | null;
    pendingTransaction: YieldPendingTransactionState | null;
    allowanceAmount: string;
    allowanceStatus: StablecoinYieldAllowanceStatus;
    approvalAction: YieldApprovalAction;
    canRevokeAllowance: boolean;
    isApprovedAmountUnlimited: boolean;
    isAmountEmpty: boolean;
    isAmountTooHigh: boolean;
    isApprovalInsufficient: boolean;
    isSubmittingApprove: boolean;
    isSubmittingAction: boolean;
    setAmountInput: (amount: string) => void;
    submitApprovalAction: () => void;
    submitAction: () => void;
    revokeAllowance: () => void;
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
    const initAllowancePromiseRef = useRef<{ abort: () => void } | null>(null);

    const { vault, token, receiptToken, apy, suppliedAmount, flowKey } = useResolvedYieldFlowData({
        account,
        routeParams,
    });
    const allowanceFlowDataRef = useCurrentRef({ account, vault, token, receiptToken });

    const session = useSelector(state => selectStablecoinYieldSession(state, flowType, flowKey));

    const maxAmount = flowType === 'supply' ? (token?.balance ?? '') : suppliedAmount;

    useEffect(() => {
        if (!flowKey) {
            return;
        }

        dispatch(stablecoinYieldActions.initSession({ flowType, flowKey }));
        dispatch(stablecoinYieldActions.resetSession({ flowType, flowKey }));

        if (flowType === 'withdraw') {
            dispatch(stablecoinYieldActions.skipApprovalStep({ flowType, flowKey }));
        }

        methodsRef.current.reset({ amountInput: '' });

        return () => {
            dispatch(stablecoinYieldActions.disposeSession({ flowType, flowKey }));
        };
    }, [flowKey, flowType, dispatch, methodsRef]);

    const { allowanceStatus } = session.approval;

    useEffect(
        () => () => {
            initAllowancePromiseRef.current?.abort();
            initAllowancePromiseRef.current = null;
        },
        [flowKey],
    );

    useEffect(() => {
        if (flowType !== 'supply' || allowanceStatus !== 'idle') {
            return;
        }

        const { account, vault, token, receiptToken } = allowanceFlowDataRef.current;

        if (!token || !receiptToken || !vault) {
            return;
        }

        const promise = dispatch(
            initYieldAllowanceThunk({
                flowKey,
                flowType,
                flowData: { account, vault, token, receiptToken },
            }),
        );

        initAllowancePromiseRef.current = promise;
        void promise.finally(() => {
            if (initAllowancePromiseRef.current === promise) {
                initAllowancePromiseRef.current = null;
            }
        });
    }, [
        account.descriptor,
        account.key,
        account.symbol,
        allowanceFlowDataRef,
        allowanceStatus,
        dispatch,
        flowKey,
        flowType,
        receiptToken?.contractAddress,
        token?.contractAddress,
        token?.decimals,
        vault?.id,
    ]);

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
            dispatch(stablecoinYieldActions.goToStep({ flowType, flowKey, step }));
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
        dispatch(stablecoinYieldActions.enterModifyMode({ flowType, flowKey }));
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
                stablecoinYieldActions.setError({
                    flowType,
                    flowKey,
                    error: 'TR_EARN_YIELD_ERROR_GENERIC',
                }),
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

    const revokeAllowance = useCallback(() => {
        if (!token || !receiptToken || !vault) {
            dispatch(
                stablecoinYieldActions.setError({
                    flowType,
                    flowKey,
                    error: 'TR_EARN_YIELD_ERROR_GENERIC',
                }),
            );

            return;
        }

        const amount = session.approval.allowanceAmount || '0';

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
    }, [
        account,
        flowKey,
        flowType,
        receiptToken,
        dispatch,
        token,
        vault,
        methodsRef,
        session.approval.allowanceAmount,
    ]);

    const liveAmount = methods.watch('amountInput');

    const approvalAction = getYieldApprovalAction({
        liveAmount,
        allowanceAmount: session.approval.allowanceAmount,
        isModifyMode: session.approval.isModifyMode,
        isRevokeRequired: session.approval.isRevokeRequired,
        tokenContractAddress: token?.contractAddress,
    });

    const submitApprovalAction = useCallback(() => {
        if (approvalAction === 'revoke') {
            revokeAllowance();

            return;
        }

        submitApprove();
    }, [approvalAction, revokeAllowance, submitApprove]);

    const submitAction = useCallback(() => {
        if (!token || !receiptToken || !vault) {
            dispatch(
                stablecoinYieldActions.setError({
                    flowType,
                    flowKey,
                    error: 'TR_EARN_YIELD_ERROR_GENERIC',
                }),
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

    const isAmountEmpty = !liveAmount;
    const allowanceAmount = session.approval.allowanceAmount ?? '0';
    const canRevokeAllowance =
        session.approval.isAllowanceUnlimited ||
        isAmountGreaterThan({ amount: allowanceAmount, threshold: '0' });
    const isAmountTooHigh = isAmountGreaterThan({ amount: liveAmount, threshold: maxAmount });
    const isApprovalInsufficient =
        !session.approval.isModifyMode &&
        isAmountGreaterThan({
            amount: liveAmount,
            threshold: session.approval.allowanceAmount ?? undefined,
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
        actionAmount: session.action.amount,
        completedAmount: session.result.completedAmount,
        completedReceiptAmount: session.result.completedReceiptAmount,
        errorMessage: session.error as TranslationKey | undefined,
        approveModalState: session.approval.modalState,
        pendingTransaction: session.action.pendingTransaction,
        allowanceAmount,
        allowanceStatus: session.approval.allowanceStatus,
        approvalAction,
        canRevokeAllowance,
        isApprovedAmountUnlimited: session.approval.isAllowanceUnlimited,
        isAmountEmpty,
        isAmountTooHigh,
        isApprovalInsufficient,
        isSubmittingApprove:
            session.approval.isSubmitting ||
            session.approval.isPending ||
            session.approval.isInitializingAllowance ||
            session.approval.modalState !== null,
        isSubmittingAction: session.action.isSubmitting,
        setAmountInput,
        submitApprovalAction,
        submitAction,
        revokeAllowance,
        enterModifyApproval,
        handleApproveModalCancel,
        handleApproveSuccessTxid,
        openPendingTransaction,
        methods,
        flow,
    };
};
