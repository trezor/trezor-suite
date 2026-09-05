import { useCallback, useEffect, useMemo, useRef } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { setConnectionModal, setConnectionMode, useDevice } from '@suite/device';
import { type TranslationKey } from '@suite/intl';
import { openModal } from '@suite/modal';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { useDispatch } from '@suite-common/redux-utils';
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
    selectYieldSession,
    submitYieldApproveThunk,
    submitYieldRevokeThunk,
    yieldActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { useCurrentRef, useFreshRef } from '@trezor/react-utils';

import {
    submitYieldDepositThunk,
    submitYieldWithdrawThunk,
} from 'src/actions/wallet/stablecoin-yield';
import { submitUnwrapNativeTokenThunk } from 'src/actions/wallet/unwrapNativeTokenThunks';
import { submitWrapNativeTokenThunk } from 'src/actions/wallet/wrapNativeTokenThunks';
import { useSelector } from 'src/hooks/suite';

import { useEnsureYieldDeviceSession } from './useEnsureYieldDeviceSession';
import { useYieldFlowData } from './useYieldFlowData';
import { type AmountIssue, useYieldForm } from './useYieldForm';
import { useYieldPendingTransactionTracking } from './useYieldPendingTransactionTracking';
import { type YieldAmountCardFiatToggleProps } from '../common/YieldAmountCard';
import {
    type YieldApprovalAction,
    getYieldApprovalAction,
    getYieldModifyAmountInput,
    isAmountGreaterThan,
    shouldInitializeYieldAllowance,
} from '../yieldFlowUtils';

type UseYieldFlowProps = {
    account: Account;
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
    liveAmount: string;
    completedAmount: string;
    completedReceiptAmount: string;
    unwrappedAmount: string | null;
    wrappedAmount: string | null;
    errorMessage: TranslationKey | undefined;
    approveModalState: YieldApproveModalState | null;
    pendingTransaction: YieldPendingTransactionState | null;
    allowanceAmount: string;
    allowanceStatus: YieldAllowanceStatus;
    approvalAction: YieldApprovalAction;
    canRevokeAllowance: boolean;
    hasWrappedTokenBalance: boolean;
    amountIssues: AmountIssue[];
    isApprovalInsufficient: boolean;
    isSubmittingApprove: boolean;
    isSubmittingAction: boolean;
    setAmountInput: (amount: string) => void;
    submitWrap: () => void;
    skipWrap: () => void;
    returnToWrapStep: () => void;
    submitUnwrap: () => void;
    skipUnwrap: () => void;
    submitApprovalAction: () => void;
    skipApprove: () => void;
    submitAction: () => void;
    revokeAllowance: () => void;
    enterModifyApproval: () => void;
    handleApproveModalCancel: () => Promise<void>;
    handleApproveSuccessTxid: (txid: string) => void;
    openPendingTransaction: (txid: string) => void;
    retryInitAllowance: () => void;
    fiatToggle: YieldAmountCardFiatToggleProps | undefined;
    setMaxAmount: (cryptoMax: string) => void;
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
    vault,
    flowType,
}: UseYieldFlowProps): UseYieldFlowResult => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { device } = useDevice();
    const initAllowancePromiseRef = useRef<{ abort: () => void } | null>(null);

    const yieldFlowData = useYieldFlowData({ account, vault });
    const { token, receiptToken, apy } = yieldFlowData;
    const depositedAmount = yieldFlowData.depositedAmount ?? '0';
    const depositedSharesAmount = yieldFlowData.depositedSharesAmount ?? '0';
    const flowKey = yieldFlowData.flowKey ?? '';

    const session = useSelector(state => selectYieldSession(state, flowType, flowKey));
    // Fresh rather than commit-lagging: callbacks read the current step and pending transaction
    // when invoked, including before the next effect commit.
    const sessionRef = useFreshRef(session);

    const {
        methods,
        liveAmount,
        maxAmount,
        setAmountInput,
        amountIssues,
        fiatToggle,
        setMaxAmount,
        resetAmounts,
    } = useYieldForm({ flowType, flowData: yieldFlowData, account, vault, flowKey, session });
    const methodsRef = useCurrentRef(methods);
    const resetAmountsRef = useCurrentRef(resetAmounts);

    const allowanceFlowDataRef = useCurrentRef({
        account,
        vault,
        token,
        receiptToken,
    });

    const ensureDeviceSession = useEnsureYieldDeviceSession({ flowType, flowKey });

    const isWrappedNativeVault = isWrappedNativeToken(account.symbol, vault.token.address);
    const hasWrappedTokenBalance = isAmountGreaterThan({
        amount: token?.balance ?? '0',
        threshold: '0',
    });
    const hasWrappedTokenBalanceRef = useCurrentRef(hasWrappedTokenBalance);

    useEffect(() => {
        if (!flowKey) return;

        dispatch(
            yieldActions.enterSession({
                flowType,
                flowKey,
                isWrappedNativeVault,
                hasWrappedTokenBalance: hasWrappedTokenBalanceRef.current,
            }),
        );

        return () => {
            dispatch(yieldActions.disposeSession({ flowType, flowKey }));
        };
    }, [flowKey, flowType, dispatch, isWrappedNativeVault, hasWrappedTokenBalanceRef]);

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

        const {
            account: currentAccount,
            vault: currentVault,
            token: currentToken,
            receiptToken: currentReceiptToken,
        } = allowanceFlowDataRef.current;

        if (!currentToken || !currentReceiptToken || !currentVault) {
            return;
        }

        const promise = dispatch(
            initYieldAllowanceThunk({
                flowKey,
                flowType,
                flowData: {
                    account: currentAccount,
                    vault: currentVault,
                    token: currentToken,
                    receiptToken: currentReceiptToken,
                },
                // Only the approve step may auto-advance on a sufficient allowance; from the
                // action step this would undo a "modify approval" click made mid-read.
                shouldSkipApprovalStep: sessionRef.current.step === 'approve',
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
                        networkSymbol: currentToken.networkSymbol,
                        vaultId: currentVault.id,
                    },
                });
            })
            .finally(() => {
                if (initAllowancePromiseRef.current === promise) {
                    initAllowancePromiseRef.current = null;
                }
            });
    }, [allowanceFlowDataRef, analytics, dispatch, flowKey, flowType, sessionRef]);

    useEffect(() => {
        if (
            !shouldInitializeYieldAllowance({
                isWrappedNativeVault,
                hasWrappedNativeSession: session.isWrappedNativeVault,
                step: session.step,
                allowanceStatus,
            })
        ) {
            return;
        }

        runInitAllowance();
    }, [
        allowanceStatus,
        isWrappedNativeVault,
        runInitAllowance,
        session.isWrappedNativeVault,
        session.step,
    ]);

    useYieldPendingTransactionTracking({
        account,
        flowType,
        flowKey,
        vault,
    });

    const flow = useMemo(
        () => ({ currentStep: session.step, isWrappedNativeVault }),
        [session.step, isWrappedNativeVault],
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
                    showCancelButton: true,
                }),
            );
        },
        [account, analytics, dispatch, vault.id, sessionRef],
    );

    const enterModifyApproval = useCallback(() => {
        dispatch(
            yieldActions.enterModifyMode({
                flowType,
                flowKey,
                amount: getYieldModifyAmountInput({
                    liveAmount: methodsRef.current.getValues('amountInput'),
                    actionAmount: sessionRef.current.action.amount,
                    maxAmount,
                }),
            }),
        );
    }, [dispatch, flowType, flowKey, methodsRef, sessionRef, maxAmount]);

    const openDeviceConnectionModal = useCallback(() => {
        if (device?.descriptor?.apiType === 'bluetooth') {
            dispatch(setConnectionMode('bluetooth'));
        }
        dispatch(setConnectionModal(true));
    }, [device, dispatch]);

    const isDeviceConnected = !!device?.connected && !!device?.available;

    const resolveWrappedNativeStep = useCallback(
        (step: 'wrap' | 'unwrap') => {
            dispatch(
                yieldActions.resolveWrappedNativeStep({
                    flowType,
                    flowKey,
                    step,
                }),
            );
        },
        [dispatch, flowKey, flowType],
    );

    const submitWrappedNative = useCallback(
        async (step: 'wrap' | 'unwrap') => {
            if (
                (step === 'wrap' && flowType !== 'deposit') ||
                (step === 'unwrap' && !isYieldWithdrawFlow(flowType))
            ) {
                return;
            }

            if (!isDeviceConnected) {
                openDeviceConnectionModal();

                return;
            }

            if (!token?.contractAddress) {
                dispatch(
                    yieldActions.setError({
                        flowType,
                        flowKey,
                        error: 'TR_EARN_YIELD_ERROR_GENERIC',
                    }),
                );

                return;
            }

            const amount = methodsRef.current.getValues('amountInput');

            if (!isAmountGreaterThan({ amount, threshold: '0' })) {
                resolveWrappedNativeStep(step);

                return;
            }

            const isSessionReady = await ensureDeviceSession();

            if (!isSessionReady) {
                return;
            }

            const wrappedToken = {
                ...token,
                contractAddress: token.contractAddress,
            };

            dispatch(yieldActions.startSubmittingWrappedNative({ flowType, flowKey }));
            try {
                let broadcastTx: { txid: string; fee: string } | undefined;

                if (step === 'wrap') {
                    broadcastTx = await dispatch(
                        submitWrapNativeTokenThunk({
                            account,
                            token: wrappedToken,
                            wrapAmount: amount,
                            yieldFlow: { flowType: 'deposit', flowKey, vaultId: vault.id },
                        }),
                    ).unwrap();
                } else if (isYieldWithdrawFlow(flowType)) {
                    broadcastTx = await dispatch(
                        submitUnwrapNativeTokenThunk({
                            account,
                            token: wrappedToken,
                            unwrapAmount: amount,
                            yieldFlow: { flowType, flowKey, vaultId: vault.id },
                        }),
                    ).unwrap();
                }

                if (broadcastTx) {
                    dispatch(
                        yieldActions.setPendingTx({
                            flowType,
                            flowKey,
                            tx: {
                                type: step,
                                txid: broadcastTx.txid,
                                amount,
                                fee: broadcastTx.fee,
                                submittedAt: Date.now(),
                            },
                        }),
                    );
                }
            } catch {
                // The thunk handles compose/sign/broadcast failures itself (toast); this guards an
                // unexpected throw around it so the step surfaces an error instead of silently
                // rejecting. The step stays put, so the user can retry.
                dispatch(
                    yieldActions.setError({
                        flowType,
                        flowKey,
                        error: 'TR_EARN_YIELD_ERROR_GENERIC',
                    }),
                );
            } finally {
                dispatch(yieldActions.finishSubmittingAction({ flowType, flowKey }));
            }
        },
        [
            account,
            dispatch,
            ensureDeviceSession,
            flowKey,
            flowType,
            isDeviceConnected,
            methodsRef,
            openDeviceConnectionModal,
            resolveWrappedNativeStep,
            token,
            vault.id,
        ],
    );

    const submitWrap = useCallback(() => {
        void submitWrappedNative('wrap');
    }, [submitWrappedNative]);

    const skipWrap = useCallback(() => {
        resolveWrappedNativeStep('wrap');
    }, [resolveWrappedNativeStep]);

    const returnToWrapStep = useCallback(() => {
        dispatch(yieldActions.returnToWrapStep({ flowType, flowKey }));
    }, [dispatch, flowKey, flowType]);

    const submitUnwrap = useCallback(() => {
        void submitWrappedNative('unwrap');
    }, [submitWrappedNative]);

    const skipUnwrap = useCallback(() => {
        resolveWrappedNativeStep('unwrap');
    }, [resolveWrappedNativeStep]);

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
                yieldActions.setError({
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
                yieldActions.setError({
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
        resetAmountsRef.current('');
    }, [
        account,
        flowKey,
        flowType,
        receiptToken,
        dispatch,
        token,
        vault,
        resetAmountsRef,
        session.approval.allowanceAmount,
        ensureDeviceSession,
        isDeviceConnected,
        openDeviceConnectionModal,
    ]);

    const approvalAction = getYieldApprovalAction({
        liveAmount,
        allowanceAmount: session.approval.allowanceAmount,
        shouldConsiderAllowance: session.approval.origin === 'modify',
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

    const skipApprove = useCallback(() => {
        dispatch(
            yieldActions.skipApprovalStep({
                flowType,
                flowKey,
                amount: methodsRef.current.getValues('amountInput'),
            }),
        );
    }, [dispatch, flowKey, flowType, methodsRef]);

    const submitAction = useCallback(async () => {
        if (!isDeviceConnected) {
            openDeviceConnectionModal();

            return;
        }

        if (!token || !receiptToken) {
            dispatch(
                yieldActions.setError({
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

    const allowanceAmount = session.approval.allowanceAmount ?? '0';
    const canRevokeAllowance = isAmountGreaterThan({ amount: allowanceAmount, threshold: '0' });
    const isApprovalInsufficient =
        session.approval.origin !== 'modify' &&
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
        liveAmount,
        completedAmount: session.result.completedAmount,
        completedReceiptAmount: session.result.completedReceiptAmount,
        unwrappedAmount: session.result.unwrappedAmount,
        wrappedAmount: session.result.wrappedAmount,
        errorMessage: session.error ?? undefined,
        approveModalState: session.approval.modalState,
        pendingTransaction: session.action.pendingTransaction,
        allowanceAmount,
        allowanceStatus: session.approval.allowanceStatus,
        approvalAction,
        canRevokeAllowance,
        hasWrappedTokenBalance,
        amountIssues,
        isApprovalInsufficient,
        isSubmittingApprove:
            session.approval.isSubmitting ||
            session.approval.allowanceStatus === 'loading' ||
            session.approval.modalState !== null,
        isSubmittingAction: session.action.isSubmitting,
        setAmountInput,
        submitWrap,
        skipWrap,
        returnToWrapStep,
        submitUnwrap,
        skipUnwrap,
        submitApprovalAction,
        skipApprove,
        submitAction,
        revokeAllowance,
        enterModifyApproval,
        handleApproveModalCancel,
        handleApproveSuccessTxid,
        openPendingTransaction,
        retryInitAllowance: runInitAllowance,
        fiatToggle,
        setMaxAmount,
        methods,
        flow,
    };
};
