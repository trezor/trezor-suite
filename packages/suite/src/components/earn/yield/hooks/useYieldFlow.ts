import { useCallback, useEffect, useMemo, useRef } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { type TranslationKey } from '@suite/intl';
import { openModal } from '@suite/modal';
import { type EarnParams } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { WRAPPED_NATIVE_TOKEN_DECIMALS } from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
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
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import {
    submitYieldDepositThunk,
    submitYieldUnwrapThunk,
    submitYieldWithdrawThunk,
    submitYieldWrapThunk,
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
    isWrapFlow: boolean;
    isWrapInsufficient: boolean;
    isWrapConfirmed: boolean;
    isWrapReserveKept: boolean;
    nativeBalance: string;
    isSubmittingWrap: boolean;
    isUnwrapFlow: boolean;
    isUnwrapEnabled: boolean;
    isSubmittingUnwrap: boolean;
    unwrappedAmount: string | null;
    setAmountInput: (amount: string) => void;
    submitApprovalAction: () => void;
    submitWrap: () => void;
    enableWrapStep: () => void;
    disableWrapStep: () => void;
    goToWrapStep: () => void;
    setUnwrapEnabled: (isEnabled: boolean) => void;
    submitUnwrap: (unwrapAmount: string) => void;
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

    const {
        token,
        receiptToken,
        apy,
        depositedAmount,
        depositedSharesAmount,
        flowKey,
        isWrappedNativeVaultToken,
        nativeFormattedBalance: nativeBalance,
        depositableBalance,
    } = useResolvedYieldFlowData({
        account,
        routeParams,
        vault,
    });

    const isWrapFlow = flowType === 'deposit' && isWrappedNativeVaultToken;
    const isWrapFlowRef = useCurrentRef(isWrapFlow);

    const isUnwrapFlow = isYieldWithdrawFlow(flowType) && isWrappedNativeVaultToken;
    const isUnwrapFlowRef = useCurrentRef(isUnwrapFlow);

    const wethBalance = token?.balance ?? '0';
    // Native ETH wrappable after keeping a reserve for the wrap/approve/deposit fees.
    const wrapMaxAmount = BigNumber.max(
        new BigNumber(nativeBalance || '0').minus(WETH_WRAP_GAS_RESERVE),
        0,
    ).toString();

    // Wrap starts ON only when there is no WETH to deposit yet; a held WETH balance means
    // the user can approve straight away.
    const shouldDefaultWrapOn = !isAmountGreaterThan({ amount: wethBalance, threshold: '0' });
    const wethBalanceRef = useCurrentRef(wethBalance);
    const shouldDefaultWrapOnRef = useCurrentRef(shouldDefaultWrapOn);
    const allowanceFlowDataRef = useCurrentRef({
        account,
        vault,
        token,
        receiptToken,
    });

    const ensureDeviceSession = useEnsureYieldDeviceSession({ flowType, flowKey });
    const session = useSelector(state => selectStablecoinYieldSession(state, flowType, flowKey));
    const sessionRef = useCurrentRef(session);

    const isSharesInput = flowType === 'redeem';
    const canToggleWithdrawUnit = isYieldWithdrawFlow(flowType) && !!token && !!receiptToken;

    const getMaxAmount = () => {
        if (flowType === 'deposit') {
            if (!isWrapFlow) {
                return token?.balance ?? '';
            }

            // Step 1 wraps native ETH (capped by the fee reserve); steps 2–3 deposit WETH.
            return session.step === 'wrap' ? wrapMaxAmount : wethBalance;
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

        const isWrapFlowSession = flowType === 'deposit' && isWrapFlowRef.current;
        const startsAtWrapStep = isWrapFlowSession && shouldDefaultWrapOnRef.current;

        if (startsAtWrapStep) {
            dispatch(stablecoinYieldActions.enterWrapStep({ flowType, flowKey }));
        }

        // Wrapped-native withdrawals receive the native coin by default — the chained
        // unwrap step can be opted out via the "Receive as ETH" toggle.
        if (isUnwrapFlowRef.current) {
            dispatch(
                stablecoinYieldActions.setUnwrapEnabled({ flowType, flowKey, isEnabled: true }),
            );
        }

        // Wrap OFF by default lands on the approve step prefilled with the held WETH balance.
        methodsRef.current.reset({
            amountInput: isWrapFlowSession && !startsAtWrapStep ? wethBalanceRef.current : '',
        });

        return () => {
            dispatch(stablecoinYieldActions.disposeSession({ flowType, flowKey }));
        };
    }, [
        flowKey,
        flowType,
        dispatch,
        methodsRef,
        isWrapFlowRef,
        isUnwrapFlowRef,
        shouldDefaultWrapOnRef,
        wethBalanceRef,
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
            if (prevStep === 'wrap' && nextStep === 'approve') {
                // Prefer the total the user committed to before wrapping (held WETH +
                // wrapped amount) — the refreshed token balance may lag behind the wrap
                // and would otherwise present a stale or unintended deposit amount.
                methodsRef.current.reset({
                    amountInput: session.action.amount ?? maxAmount,
                });
            }

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

    const flow = useMemo(() => ({ currentStep: session.step }), [session.step]);

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

    const enableWrapStep = useCallback(() => {
        dispatch(stablecoinYieldActions.enterWrapStep({ flowType, flowKey }));
        methodsRef.current.reset({ amountInput: '' });
    }, [dispatch, flowType, flowKey, methodsRef]);

    const disableWrapStep = useCallback(() => {
        dispatch(
            stablecoinYieldActions.skipWrapStep({
                flowType,
                flowKey,
                amount: wethBalanceRef.current,
            }),
        );
        dispatch(stablecoinYieldActions.invalidateAllowance({ flowType, flowKey }));
    }, [dispatch, flowType, flowKey, wethBalanceRef]);

    const goToWrapStep = useCallback(() => {
        const currentAmount = methodsRef.current.getValues('amountInput');
        const shortfall = BigNumber.max(
            new BigNumber(currentAmount || '0').minus(wethBalanceRef.current),
            0,
        )
            .decimalPlaces(WRAPPED_NATIVE_TOKEN_DECIMALS, BigNumber.ROUND_UP)
            .toString();

        dispatch(stablecoinYieldActions.enterWrapStep({ flowType, flowKey }));
        methodsRef.current.setValue('amountInput', shortfall);
    }, [dispatch, flowType, flowKey, methodsRef, wethBalanceRef]);

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

    const liveAmount = methods.watch('amountInput');

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

    const submitWrap = useCallback(() => {
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

        if (!isDeviceConnected) {
            openDeviceConnectionModal();

            return;
        }

        const wrapAmount = methodsRef.current.getValues('amountInput');

        void dispatch(
            submitYieldWrapThunk({
                flowKey,
                flowData: { account, vault, token, receiptToken },
                wrapAmount,
                totalDepositAmount: new BigNumber(wrapAmount || '0')
                    .plus(wethBalanceRef.current)
                    .toString(),
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
        wethBalanceRef,
        isDeviceConnected,
        openDeviceConnectionModal,
    ]);

    const setUnwrapEnabled = useCallback(
        (isEnabled: boolean) => {
            dispatch(stablecoinYieldActions.setUnwrapEnabled({ flowType, flowKey, isEnabled }));
        },
        [dispatch, flowType, flowKey],
    );

    const submitUnwrap = useCallback(
        (unwrapAmount: string) => {
            if (!isYieldWithdrawFlow(flowType) || !token || !receiptToken) {
                dispatch(
                    stablecoinYieldActions.setError({
                        flowType,
                        flowKey,
                        error: 'TR_EARN_YIELD_ERROR_GENERIC',
                    }),
                );

                return;
            }

            if (!isDeviceConnected) {
                openDeviceConnectionModal();

                return;
            }

            void dispatch(
                submitYieldUnwrapThunk({
                    flowKey,
                    flowType,
                    flowData: { account, vault, token, receiptToken },
                    unwrapAmount,
                }),
            );
        },
        [
            account,
            flowKey,
            flowType,
            receiptToken,
            dispatch,
            token,
            vault,
            isDeviceConnected,
            openDeviceConnectionModal,
        ],
    );

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

    // Past the wrap step (or with wrap OFF) the deposit amount can exceed the held WETH,
    // which means the user needs to wrap more before approving.
    const isWrapInsufficient =
        isWrapFlow &&
        session.step !== 'wrap' &&
        isAmountGreaterThan({ amount: liveAmount, threshold: wethBalance });
    const isWrapConfirmed = session.wrap.wrappedAmount !== null;

    const isAmountEmpty =
        !liveAmount || !isAmountGreaterThan({ amount: liveAmount, threshold: '0' });
    const allowanceAmount = session.approval.allowanceAmount ?? '0';
    const canRevokeAllowance = isAmountGreaterThan({ amount: allowanceAmount, threshold: '0' });
    // On the wrap step the cap keeps the gas reserve behind — wrapping the full native
    // balance would leave nothing for the wrap fee itself. Past the wrap step the cap is
    // the total depositable balance so amounts above the WETH balance surface "wrap
    // more", not "too high".
    const wrapFlowCap = session.step === 'wrap' ? wrapMaxAmount : depositableBalance;
    const amountCap = isWrapFlow ? wrapFlowCap : maxAmount;
    const isAmountTooHigh = isAmountGreaterThan({ amount: liveAmount, threshold: amountCap });
    // The wrap Max keeps a fee reserve behind — surface that whenever the input sits at it.
    const isWrapReserveKept =
        isWrapFlow &&
        session.step === 'wrap' &&
        new BigNumber(wrapMaxAmount).gt(0) &&
        liveAmount === wrapMaxAmount;
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
        isWrapFlow,
        isWrapInsufficient,
        isWrapReserveKept,
        isWrapConfirmed,
        nativeBalance,
        isSubmittingWrap: session.wrap.isSubmitting,
        isUnwrapFlow,
        isUnwrapEnabled: session.unwrap.isEnabled,
        isSubmittingUnwrap: session.unwrap.isSubmitting,
        unwrappedAmount: session.unwrap.unwrappedAmount,
        setAmountInput,
        submitApprovalAction,
        submitWrap,
        enableWrapStep,
        disableWrapStep,
        goToWrapStep,
        setUnwrapEnabled,
        submitUnwrap,
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
