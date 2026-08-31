import { useCallback, useEffect, useMemo, useRef } from 'react';
import { type UseFormReturn, useForm, useWatch } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { setConnectionModal, setConnectionMode, useDevice } from '@suite/device';
import { type TranslationKey } from '@suite/intl';
import { openModal } from '@suite/modal';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { useSelector } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type YieldAllowanceStatus,
    type YieldApproveModalState,
    type YieldFlowDisplayToken,
    type YieldFlowFormValues,
    type YieldFlowStepId,
    type YieldFlowToken,
    type YieldPendingTransactionState,
    type YieldPositionFlowType,
    getMaxWrapAmount,
    handleYieldApproveCancelThunk,
    handleYieldApproveSuccessTxidThunk,
    initYieldAllowanceThunk,
    isStablecoinYieldSessionResumable,
    isYieldWithdrawFlow,
    selectStablecoinYieldSession,
    stablecoinYieldActions,
    submitYieldApproveThunk,
    submitYieldRevokeThunk,
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

import { useEnsureYieldDeviceSession } from './useEnsureYieldDeviceSession';
import { useYieldFiatInput } from './useYieldFiatInput';
import { useYieldFlowData } from './useYieldFlowData';
import { useYieldPendingTransactionTracking } from './useYieldPendingTransactionTracking';
import { type YieldAmountCardFiatToggleProps } from '../common/YieldAmountCard';
import {
    type YieldApprovalAction,
    getYieldApprovalAction,
    getYieldFiatRateToken,
    getYieldModifyAmountInput,
    getYieldUnwrapDefaultAmount,
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
    inputTokenSymbol: string;
    otherUnitTokenSymbol: string;
    canToggleWithdrawUnit: boolean;
    liveAmount: string;
    actionAmount: string | null;
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
    isAmountEmpty: boolean;
    isAmountTooHigh: boolean;
    isAmountInvalidDecimals: boolean;
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
    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: {
            amountInput: '',
            fiatInput: '',
        },
    });
    const methodsRef = useCurrentRef(methods);
    const initAllowancePromiseRef = useRef<{ abort: () => void } | null>(null);
    const unwrapDefaultAmountRef = useRef<string | null>(null);

    const yieldFlowData = useYieldFlowData({ account, vault });
    const { token, receiptToken, apy } = yieldFlowData;

    const depositedAmount = yieldFlowData.depositedAmount ?? '0';
    const depositedSharesAmount = yieldFlowData.depositedSharesAmount ?? '0';
    const flowKey = yieldFlowData.flowKey ?? '';

    const allowanceFlowDataRef = useCurrentRef({
        account,
        vault,
        token,
        receiptToken,
    });

    const ensureDeviceSession = useEnsureYieldDeviceSession({ flowType, flowKey });
    const session = useSelector(state => selectStablecoinYieldSession(state, flowType, flowKey));
    // Fresh rather than commit-lagging: the entry effect below reads the session to decide whether
    // the flow resumes, and a value one commit behind would restart a session it should keep.
    const sessionRef = useFreshRef(session);

    const isWrappedNativeVault = isWrappedNativeToken(account.symbol, vault.token.address);
    const hasWrappedTokenBalance = isAmountGreaterThan({
        amount: token?.balance ?? '0',
        threshold: '0',
    });
    const hasWrappedTokenBalanceRef = useCurrentRef(hasWrappedTokenBalance);

    const isSharesInput = flowType === 'redeem';
    const canToggleWithdrawUnit = isYieldWithdrawFlow(flowType) && !!token && !!receiptToken;

    // Fiat entry prices the amount by the token currently shown (native for wrap/unwrap, the vault
    // asset for deposit/withdraw, none while redeeming shares).
    const rateToken = getYieldFiatRateToken({
        step: session.step,
        flowType,
        accountSymbol: account.symbol,
        token,
    });
    const { fiatToggle, setMaxAmount, resetAmounts } = useYieldFiatInput({
        methods,
        symbol: rateToken?.symbol,
        tokenAddress: rateToken?.tokenAddress,
        decimals: token?.decimals ?? getNetwork(account.symbol).decimals,
        vaultId: vault.id,
    });
    const resetAmountsRef = useCurrentRef(resetAmounts);

    const getMaxAmount = () => {
        if (flowType === 'deposit') {
            if (session.step === 'wrap') {
                // Max leaves the gas reserve aside while the balance covers it, otherwise it fills
                // the whole balance. Either way the field shows the full balance and the user may
                // wrap up to it (see `amountTooHighThreshold`), with a recommendation.
                return getMaxWrapAmount(account.formattedBalance);
            }

            return token?.balance ?? '';
        }
        if (session.step === 'unwrap') {
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
        if (!flowKey) return;

        // A session that is mid-flow survives disposal (see `isStablecoinYieldSessionResumable`),
        // so re-entering the flow resumes it — step, approval and pending state included — instead
        // of starting over. `enterSession` makes that call on the live state, including the wrap
        // step a fresh wrapped-native deposit can open past.
        const resumedSession = isStablecoinYieldSessionResumable(sessionRef.current)
            ? sessionRef.current
            : null;

        dispatch(
            stablecoinYieldActions.enterSession({
                flowType,
                flowKey,
                isWrappedNativeVault,
                hasWrappedTokenBalance: hasWrappedTokenBalanceRef.current,
            }),
        );

        // A resumed flow shows the amount it was left with: the one locked by the transaction in
        // flight, or the one its confirmed transaction moved on to the next step.
        resetAmountsRef.current(
            resumedSession
                ? (resumedSession.action.pendingTransaction?.amount ??
                      resumedSession.action.amount ??
                      '')
                : '',
        );

        return () => {
            dispatch(stablecoinYieldActions.disposeSession({ flowType, flowKey }));
        };
    }, [
        flowKey,
        flowType,
        dispatch,
        isWrappedNativeVault,
        hasWrappedTokenBalanceRef,
        resetAmountsRef,
        sessionRef,
    ]);

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

    // Sync form value on step transitions driven by Redux (e.g. completeApproval, enterModifyMode from thunk)
    const prevStepRef = useRef<YieldFlowStepId | null>(null);

    useEffect(() => {
        const prevStep = prevStepRef.current;
        const nextStep = session.step;

        if (prevStep !== null && prevStep !== nextStep) {
            if (prevStep === 'wrap' && nextStep === 'approve') {
                resetAmountsRef.current(session.action.amount ?? '');
            }

            if (nextStep === 'wrap') {
                methodsRef.current.reset({ amountInput: '', fiatInput: '' });
            }

            if (prevStep === 'approve' && nextStep === 'action') {
                const actionAmount = session.action.amount ?? '';
                const cappedAmount = isAmountGreaterThan({
                    amount: actionAmount,
                    threshold: maxAmount,
                })
                    ? maxAmount
                    : actionAmount;
                resetAmountsRef.current(cappedAmount);
            }

            if (prevStep === 'action' && nextStep === 'approve') {
                resetAmountsRef.current(
                    getYieldModifyAmountInput({
                        liveAmount: methodsRef.current.getValues('amountInput'),
                        actionAmount: session.action.amount,
                        maxAmount,
                    }),
                );
            }
        }

        prevStepRef.current = nextStep;
    }, [session.step, session.action.amount, methodsRef, resetAmountsRef, maxAmount]);

    // The withdraw flow's unwrap step must default to the amount just withdrawn (in asset units),
    // not the account's whole wrapped-native balance — otherwise it would sweep in unrelated WETH
    // the user never meant to unwrap (trezor/trezor-suite#30559).
    const pricePerShareState = vault.state?.pricePerShareState;
    const unwrapDefaultAmount = useMemo(() => {
        if (!token || !receiptToken || !isYieldWithdrawFlow(flowType)) {
            return token?.balance ?? '';
        }

        return getYieldUnwrapDefaultAmount({
            flowType,
            withdrawnAmount: session.result.completedAmount,
            token,
            receiptToken,
            pricePerShareState,
            fallbackAmount: token.balance,
        });
    }, [flowType, pricePerShareState, receiptToken, session.result.completedAmount, token]);

    useEffect(() => {
        if (session.step !== 'unwrap') {
            unwrapDefaultAmountRef.current = null;

            return;
        }

        const currentAmount = methodsRef.current.getValues('amountInput');

        if (
            unwrapDefaultAmountRef.current === null ||
            currentAmount === unwrapDefaultAmountRef.current
        ) {
            resetAmountsRef.current(unwrapDefaultAmount);
        }

        unwrapDefaultAmountRef.current = unwrapDefaultAmount;
    }, [methodsRef, resetAmountsRef, session.step, unwrapDefaultAmount]);

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

    const resolveWrappedNativeStep = useCallback(
        (step: 'wrap' | 'unwrap') => {
            dispatch(
                stablecoinYieldActions.resolveWrappedNativeStep({
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
                    stablecoinYieldActions.setError({
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

            dispatch(stablecoinYieldActions.startSubmittingWrappedNative({ flowType, flowKey }));
            try {
                let txid: string | undefined;

                if (step === 'wrap') {
                    const result = await dispatch(
                        submitWrapNativeTokenThunk({
                            account,
                            token: wrappedToken,
                            wrapAmount: amount,
                            yieldFlow: { flowType: 'deposit', flowKey, vaultId: vault.id },
                        }),
                    ).unwrap();
                    txid = result?.txid;
                } else if (isYieldWithdrawFlow(flowType)) {
                    const result = await dispatch(
                        submitUnwrapNativeTokenThunk({
                            account,
                            token: wrappedToken,
                            unwrapAmount: amount,
                            yieldFlow: { flowType, flowKey, vaultId: vault.id },
                        }),
                    ).unwrap();
                    txid = result?.txid;
                }

                if (txid) {
                    dispatch(
                        stablecoinYieldActions.setPendingTx({
                            flowType,
                            flowKey,
                            tx: {
                                type: step,
                                txid,
                                amount,
                            },
                        }),
                    );
                }
            } catch {
                // The thunk handles compose/sign/broadcast failures itself (toast); this guards an
                // unexpected throw around it so the step surfaces an error instead of silently
                // rejecting. The step stays put, so the user can retry.
                dispatch(
                    stablecoinYieldActions.setError({
                        flowType,
                        flowKey,
                        error: 'TR_EARN_YIELD_ERROR_GENERIC',
                    }),
                );
            } finally {
                dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType, flowKey }));
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
        dispatch(stablecoinYieldActions.returnToWrapStep({ flowType, flowKey }));
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
        methodsRef.current.reset({ amountInput: '', fiatInput: '' });
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

    const skipApprove = useCallback(() => {
        dispatch(
            stablecoinYieldActions.skipApprovalStep({
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
    // On the wrap step the hard cap is the full native balance: `maxAmount` holds the gas reserve
    // aside for the Max button only while the balance covers it, and manually eating into the
    // reserve is a non-blocking recommendation rather than an "insufficient funds" error.
    const amountTooHighThreshold =
        flowType === 'deposit' && session.step === 'wrap' ? account.formattedBalance : maxAmount;
    const isAmountTooHigh = isAmountGreaterThan({
        amount: liveAmount,
        threshold: amountTooHighThreshold,
    });
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
