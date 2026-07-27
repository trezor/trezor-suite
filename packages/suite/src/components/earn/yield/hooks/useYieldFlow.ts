import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type UseFormReturn, useForm, useWatch } from 'react-hook-form';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { type TranslationKey } from '@suite/intl';
import { openModal } from '@suite/modal';
import { type EarnParams } from '@suite/router';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import {
    type YieldAllowanceStatus,
    type YieldApproveModalState,
    type YieldFlowDisplayToken,
    type YieldFlowFormValues,
    type YieldFlowStepId,
    type YieldFlowToken,
    type YieldPendingTransactionState,
    type YieldPositionFlowType,
    handleYieldApproveCancelThunk,
    handleYieldApproveSuccessTxidThunk,
    initYieldAllowanceThunk,
    isYieldWithdrawFlow,
    selectStablecoinYieldSession,
    stablecoinYieldActions,
    submitYieldApproveThunk,
    submitYieldRevokeThunk,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isWrappedNativeToken } from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import {
    submitYieldDepositThunk,
    submitYieldWithdrawThunk,
} from 'src/actions/wallet/stablecoin-yield';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { useEnsureYieldDeviceSession } from './useEnsureYieldDeviceSession';
import { useResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { useYieldPendingTransactionTracking } from './useYieldPendingTransactionTracking';
import {
    type YieldApprovalAction,
    getYieldApprovalAction,
    getYieldModifyAmountInput,
    isAmountGreaterThan,
} from '../yieldFlowUtils';

type UseYieldFlowProps = {
    account: Account;
    routeParams: EarnParams;
    vault: YieldDtoV2;
    flowType: YieldPositionFlowType;
};

type UseYieldFlowStepsResult = {
    currentStep: YieldFlowStepId;
    isWrappedNativeVault: boolean;
};

export type UseYieldFlowResult = {
    account: Account;
    vault: YieldDtoV2;
    token: YieldFlowToken | null;
    receiptToken: YieldFlowDisplayToken | null;
    apy: number | null;
    depositedAmount: string;
    depositedSharesAmount: string;
    flowKey: string;
    maxAmount: string;
    flowType: YieldPositionFlowType;
    inputTokenSymbol: string;
    otherUnitTokenSymbol: string;
    canToggleWithdrawUnit: boolean;
    liveAmount: string;
    actionAmount: string | null;
    completedAmount: string;
    completedReceiptAmount: string;
    errorMessage: TranslationKey | undefined;
    approveModalState: YieldApproveModalState | null;
    pendingTransaction: YieldPendingTransactionState | null;
    allowanceAmount: string;
    allowanceStatus: YieldAllowanceStatus;
    approvalAction: YieldApprovalAction;
    canRevokeAllowance: boolean;
    isAmountEmpty: boolean;
    isAmountTooHigh: boolean;
    isAmountInvalidDecimals: boolean;
    isApprovalInsufficient: boolean;
    isSubmittingApprove: boolean;
    isSubmittingAction: boolean;
    setAmountInput: (amount: string) => void;
    completeWrapStep: () => void;
    completeUnwrapStep: () => void;
    submitApprovalAction: () => void;
    submitAction: () => void;
    revokeAllowance: () => void;
    enterModifyApproval: () => void;
    handleApproveModalCancel: () => Promise<void>;
    handleApproveSuccessTxid: (txid: string) => void;
    openPendingTransaction: (txid: string) => void;
    retryInitAllowance: () => void;
    methods: UseFormReturn<YieldFlowFormValues>;
    flow: UseYieldFlowStepsResult;
};

/** Context value type shared by both deposit and withdraw — non-null token/receiptToken/vault. */
export type YieldFlowContextValues = Omit<
    UseYieldFlowResult,
    'token' | 'receiptToken' | 'vault'
> & {
    token: YieldFlowToken;
    receiptToken: YieldFlowDisplayToken;
    vault: YieldDtoV2;
};

export const useYieldFlow = ({
    account,
    routeParams,
    vault,
    flowType,
}: UseYieldFlowProps): UseYieldFlowResult => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { device } = useDevice();
    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: {
            amountInput: '',
        },
    });
    const methodsRef = useCurrentRef(methods);
    const initAllowancePromiseRef = useRef<{ abort: () => void } | null>(null);

    const { token, receiptToken, apy, depositedAmount, depositedSharesAmount, flowKey } =
        useResolvedYieldFlowData({
            account,
            routeParams,
            vault,
        });
    const allowanceFlowDataRef = useCurrentRef({
        account,
        vault,
        token,
        receiptToken,
    });

    const ensureDeviceSession = useEnsureYieldDeviceSession({ flowType, flowKey });
    const session = useSelector(state => selectStablecoinYieldSession(state, flowType, flowKey));
    const sessionRef = useCurrentRef(session);

    const isWrappedNativeVault = isWrappedNativeToken(account.symbol, vault.token.address);
    const hasWrapStep = flowType === 'deposit' && isWrappedNativeVault;
    const hasUnwrapStep = isYieldWithdrawFlow(flowType) && isWrappedNativeVault;
    const [isWrapStepCompleted, setIsWrapStepCompleted] = useState(false);
    const [isUnwrapStepResolved, setIsUnwrapStepResolved] = useState(false);

    const isSharesInput = flowType === 'redeem';
    const canToggleWithdrawUnit = isYieldWithdrawFlow(flowType) && !!token && !!receiptToken;

    const getMaxAmount = () => {
        if (flowType === 'deposit') {
            return token?.balance ?? '';
        }
        if (isSharesInput) {
            return depositedSharesAmount;
        }

        return depositedAmount;
    };
    const maxAmount = getMaxAmount();

    const inputTokenSymbol = isSharesInput ? (receiptToken?.symbol ?? '') : (token?.symbol ?? '');
    const otherUnitTokenSymbol = isSharesInput
        ? (token?.symbol ?? '')
        : (receiptToken?.symbol ?? '');

    useEffect(() => {
        if (!flowKey) {
            return;
        }

        dispatch(stablecoinYieldActions.initSession({ flowType, flowKey }));
        dispatch(stablecoinYieldActions.resetSession({ flowType, flowKey }));

        methodsRef.current.reset({ amountInput: '' });
        setIsWrapStepCompleted(false);
        setIsUnwrapStepResolved(false);

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

    const runInitAllowance = useCallback(() => {
        if (flowType !== 'deposit') {
            return;
        }

        const { account, vault: currentVault, token, receiptToken } = allowanceFlowDataRef.current;

        if (!token || !receiptToken || !currentVault) {
            return;
        }

        const promise = dispatch(
            initYieldAllowanceThunk({
                flowKey,
                flowType,
                flowData: { account, vault: currentVault, token, receiptToken },
            }),
        );

        initAllowancePromiseRef.current = promise;
        void promise
            .unwrap()
            .catch(() => {
                analytics.report({
                    type: events.yieldInteractionEvent.name,
                    payload: {
                        element: 'allowance-error-banner',
                        networkSymbol: token.networkSymbol,
                        vaultId: currentVault.id,
                    },
                });
            })
            .finally(() => {
                if (initAllowancePromiseRef.current === promise) {
                    initAllowancePromiseRef.current = null;
                }
            });
    }, [allowanceFlowDataRef, analytics, dispatch, flowKey, flowType]);

    useEffect(() => {
        if (allowanceStatus !== 'idle') {
            return;
        }
        runInitAllowance();
    }, [allowanceStatus, runInitAllowance]);

    useYieldPendingTransactionTracking({
        account,
        flowType,
        flowKey,
        vault,
    });

    // Sync form value on step transitions driven by Redux (e.g. completeApproval, enterModifyMode from thunk)
    const prevStepRef = useRef<YieldFlowStepId | null>(null);

    useEffect(() => {
        const prevStep = prevStepRef.current;
        const nextStep = session.step;

        if (prevStep !== null && prevStep !== nextStep) {
            if (prevStep === 'approve' && nextStep === 'action') {
                const actionAmount = session.action.amount ?? '';
                const cappedAmount = isAmountGreaterThan({
                    amount: actionAmount,
                    threshold: maxAmount,
                })
                    ? maxAmount
                    : actionAmount;
                methodsRef.current.reset({
                    amountInput: cappedAmount,
                });
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

    // TODO(#29864, #29866): dummy wrap/unwrap steps — they only advance the UI; the wrap
    // and unwrap transactions themselves come with the shared wrap thunks.
    const completeWrapStep = useCallback(() => {
        setIsWrapStepCompleted(true);
    }, []);

    const completeUnwrapStep = useCallback(() => {
        setIsUnwrapStepResolved(true);
    }, []);

    const getCurrentStep = (): YieldFlowStepId => {
        if (hasWrapStep && !isWrapStepCompleted) {
            return 'wrap';
        }

        // The unwrap step is chained after the action confirms, before the complete screen.
        if (hasUnwrapStep && !isUnwrapStepResolved && session.step === 'complete') {
            return 'unwrap';
        }

        return session.step;
    };
    const currentStep = getCurrentStep();
    const flow = useMemo(
        () => ({ currentStep, isWrappedNativeVault }),
        [currentStep, isWrappedNativeVault],
    );

    const openPendingTransaction = useCallback(
        (txid: string) => {
            const pendingTxType = sessionRef.current.action.pendingTransaction?.type;
            if (pendingTxType) {
                analytics.report({
                    type: events.yieldInteractionEvent.name,
                    payload: {
                        element: 'pending-tx-open',
                        value: pendingTxType,
                        networkSymbol: account.symbol,
                        vaultId: vault.id,
                    },
                });
            }

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
        [account, analytics, dispatch, vault.id, sessionRef],
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

    const openDeviceConnectionModal = useCallback(() => {
        if (device?.descriptor?.apiType === 'bluetooth') {
            dispatch(setConnectionMode('bluetooth'));
        }
        dispatch(setConnectionModal(true));
    }, [device, dispatch]);

    const isDeviceConnected = !!device?.connected && !!device?.available;

    const submitApprove = useCallback(async () => {
        if (flowType !== 'deposit') {
            return;
        }

        if (!isDeviceConnected) {
            openDeviceConnectionModal();

            return;
        }

        if (!token || !receiptToken) {
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

        const isSessionReady = await ensureDeviceSession();

        if (!isSessionReady) {
            return;
        }

        await dispatch(
            submitYieldApproveThunk({
                flowKey,
                flowType,
                flowData: { account, vault, token, receiptToken },
                amount,
            }),
        );
    }, [
        account,
        flowKey,
        flowType,
        receiptToken,
        dispatch,
        token,
        vault,
        methodsRef,
        ensureDeviceSession,
        isDeviceConnected,
        openDeviceConnectionModal,
    ]);

    const revokeAllowance = useCallback(async () => {
        if (!isDeviceConnected) {
            openDeviceConnectionModal();

            return;
        }

        if (!token || !receiptToken) {
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

        const isSessionReady = await ensureDeviceSession();

        if (!isSessionReady) {
            return;
        }

        await dispatch(
            submitYieldRevokeThunk({
                flowKey,
                flowType,
                flowData: { account, vault, token, receiptToken },
                amount,
            }),
        );
        methodsRef.current.reset({ amountInput: '' });
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
        ensureDeviceSession,
        isDeviceConnected,
        openDeviceConnectionModal,
    ]);

    const liveAmount = useWatch({ control: methods.control, name: 'amountInput' });

    const approvalAction = getYieldApprovalAction({
        liveAmount,
        allowanceAmount: session.approval.allowanceAmount,
        isModifyMode: session.approval.isModifyMode,
        isRevokeRequired: session.approval.isRevokeRequired,
        tokenContractAddress: token?.contractAddress,
    });

    const submitApprovalAction = useCallback(async () => {
        if (approvalAction === 'revoke') {
            await revokeAllowance();

            return;
        }

        await submitApprove();
    }, [approvalAction, revokeAllowance, submitApprove]);

    const submitAction = useCallback(async () => {
        if (!isDeviceConnected) {
            openDeviceConnectionModal();

            return;
        }

        if (!token || !receiptToken) {
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

        const isSessionReady = await ensureDeviceSession();

        if (!isSessionReady) {
            return;
        }

        if (isYieldWithdrawFlow(flowType)) {
            await dispatch(
                submitYieldWithdrawThunk({
                    flowKey,
                    flowData: { account, vault, token, receiptToken },
                    amount,
                    flowType,
                }),
            );

            return;
        }

        await dispatch(
            submitYieldDepositThunk({
                flowKey,
                flowData: { account, vault, token, receiptToken },
                amount,
            }),
        );
    }, [
        account,
        flowKey,
        flowType,
        receiptToken,
        dispatch,
        token,
        vault,
        methodsRef,
        ensureDeviceSession,
        isDeviceConnected,
        openDeviceConnectionModal,
    ]);

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

    const isAmountEmpty =
        !liveAmount || !isAmountGreaterThan({ amount: liveAmount, threshold: '0' });
    const allowanceAmount = session.approval.allowanceAmount ?? '0';
    const canRevokeAllowance = isAmountGreaterThan({ amount: allowanceAmount, threshold: '0' });
    const isAmountTooHigh = isAmountGreaterThan({ amount: liveAmount, threshold: maxAmount });
    const isAmountInvalidDecimals = !!methods.formState.errors.amountInput;
    const isApprovalInsufficient =
        !session.approval.isModifyMode &&
        session.approval.allowanceStatus === 'loaded' &&
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
        depositedAmount,
        depositedSharesAmount,
        flowKey,
        maxAmount,
        flowType,
        inputTokenSymbol,
        otherUnitTokenSymbol,
        canToggleWithdrawUnit,
        liveAmount,
        actionAmount: session.action.amount,
        completedAmount: session.result.completedAmount,
        completedReceiptAmount: session.result.completedReceiptAmount,
        errorMessage: session.error ?? undefined,
        approveModalState: session.approval.modalState,
        pendingTransaction: session.action.pendingTransaction,
        allowanceAmount,
        allowanceStatus: session.approval.allowanceStatus,
        approvalAction,
        canRevokeAllowance,
        isAmountEmpty,
        isAmountTooHigh,
        isAmountInvalidDecimals,
        isApprovalInsufficient,
        isSubmittingApprove:
            session.approval.isSubmitting ||
            session.approval.allowanceStatus === 'loading' ||
            session.approval.modalState !== null,
        isSubmittingAction: session.action.isSubmitting,
        setAmountInput,
        completeWrapStep,
        completeUnwrapStep,
        submitApprovalAction,
        submitAction,
        revokeAllowance,
        enterModifyApproval,
        handleApproveModalCancel,
        handleApproveSuccessTxid,
        openPendingTransaction,
        retryInitAllowance: runInitAllowance,
        methods,
        flow,
    };
};
