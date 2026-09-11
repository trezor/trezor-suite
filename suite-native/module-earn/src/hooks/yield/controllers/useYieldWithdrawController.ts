import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useDispatch } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type YieldWithdrawFlowType,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getWithdrawRequestAmount,
    getYieldWithdrawInputToken,
    splitYieldPendingTransaction,
    yieldActions,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { asAmountSubunit, getApyBreakdown, subunitsToUnits } from '@suite-common/wallet-utils';
import { useBottomSheetModal } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { decimalTransformer } from '@suite-native/helpers';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { useTransactionDetails } from '@suite-native/transaction-management';
import { BigNumber } from '@trezor/utils';

import { useYieldFlowScreenBase } from './useYieldFlowScreenBase';
import { isAmountInputValueValid } from '../../../utils/yield/yieldFiatAmountUtils';
import { getYieldWithdrawAmountValidationError } from '../../../utils/yield/yieldWithdrawUtils';
import { useNavigateBackAnalytics } from '../../earn/useNavigateBackAnalytics';
import { useYieldFlowAnalytics } from '../useYieldFlowAnalytics';
import { useYieldPendingSheet } from '../useYieldPendingSheet';
import { useYieldPendingTransactionTracking } from '../useYieldPendingTransactionTracking';
import { useYieldWithdrawFees } from '../useYieldWithdrawFees';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldWithdraw>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldWithdraw>;

const getYieldWithdrawFlowTypeByInputView = (
    activeView: 'primary' | 'secondary',
): YieldWithdrawFlowType => (activeView === 'secondary' ? 'redeem' : 'withdraw');

export const useYieldWithdrawController = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();

    const [assetAmount, setAssetAmount] = useState('');
    const [sharesAmount, setSharesAmount] = useState('');
    const [isMaxWithdrawInfoVisible, setIsMaxWithdrawInfoVisible] = useState(false);
    const [isMaxSelected, setIsMaxSelected] = useState(false);
    const [flowType, setFlowType] = useState<YieldWithdrawFlowType>(
        route.params.withdrawFlowType ?? 'withdraw',
    );
    const isSharesInput = flowType === 'redeem';
    const amount = isSharesInput ? sharesAmount : assetAmount;
    const {
        bottomSheetRef: pendingBottomSheetRef,
        closeModal: closePendingBottomSheet,
        openModal: openPendingBottomSheet,
    } = useBottomSheetModal();

    const { isFocused, messageSystem, session, yieldFlowData } = useYieldFlowScreenBase({
        flowType,
        messageSystemType: 'withdraw',
        routeParams: route.params,
        shouldDisposeSessionOnGoBack: true,
    });
    const {
        account,
        depositedAmount,
        depositedSharesAmount,
        flowData,
        flowKey,
        isWrappedNativeVault,
        resolutionStatus,
        vault,
    } = yieldFlowData;

    const { reportInteraction, reportWithdraw } = useYieldFlowAnalytics({
        networkSymbol: account?.symbol,
        vaultId: vault?.id,
    });

    useNavigateBackAnalytics({
        type: events.yieldNavigateEvent.name,
        payload: {
            action: 'cancel',
            from: 'withdraw-form',
            to: 'withdraw-form',
            networkSymbol: account?.symbol,
            vaultId: vault?.id,
        },
    });

    const activeInputToken = flowData
        ? getYieldWithdrawInputToken({ flowData, flowType })
        : undefined;
    const amountValidationError = getYieldWithdrawAmountValidationError({
        amount,
        decimals: activeInputToken?.decimals,
    });

    const isAmountValidationErrorDisplayed = !!amountValidationError;

    const maxAmount = isSharesInput ? depositedSharesAmount : depositedAmount;
    const isAmountTooHigh = useMemo(
        () => !!amount && !!maxAmount && new BigNumber(amount).gt(maxAmount),
        [amount, maxAmount],
    );
    const withdrawFees = useYieldWithdrawFees({
        amount,
        flowType,
        flowData,
        flowKey,
        isEnabled:
            resolutionStatus === 'resolved' &&
            !!amount &&
            !isAmountTooHigh &&
            !isAmountValidationErrorDisplayed,
    });
    const {
        fee: withdrawFee,
        formDraft: withdrawFeeFormDraft,
        hasFeeEstimationError,
        isComposingWithdrawFee,
        isFeeUnavailable,
        preparedAction,
    } = withdrawFees;
    const feeFiatConverters = useCryptoFiatConverters({
        symbol: account?.symbol ?? null,
    });
    const amountFiatTokenContract = activeInputToken?.contractAddress
        ? toTokenAddress(activeInputToken.contractAddress)
        : undefined;

    const amountFiatConverters = useCryptoFiatConverters({
        symbol: account?.symbol ?? null,
        tokenContract: amountFiatTokenContract,
    });

    const shouldShowNetworkFeeWarning = useMemo(() => {
        if (
            !amount ||
            isAmountValidationErrorDisplayed ||
            !withdrawFee ||
            resolutionStatus !== 'resolved' ||
            preparedAction?.amount !== amount ||
            preparedAction.flowType !== flowType
        ) {
            return false;
        }

        const amountFiat = amountFiatConverters?.convertCryptoToFiat(new BigNumber(amount));
        const feeUnits = subunitsToUnits({
            value: asAmountSubunit(new BigNumber(withdrawFee)),
            symbol: account.symbol,
        });
        const feeFiat = feeFiatConverters?.convertCryptoToFiat(new BigNumber(feeUnits));

        return !!amountFiat && !!feeFiat && feeFiat.gt(amountFiat);
    }, [
        account,
        amount,
        isAmountValidationErrorDisplayed,
        amountFiatConverters,
        feeFiatConverters,
        preparedAction,
        resolutionStatus,
        withdrawFee,
        flowType,
    ]);

    const isWithdrawReviewReady =
        !!amount &&
        preparedAction?.amount === amount &&
        preparedAction.flowType === flowType &&
        !!withdrawFeeFormDraft;

    const pendingTransaction = session?.action.pendingTransaction ?? null;
    const { actionPendingTransaction } = splitYieldPendingTransaction(pendingTransaction, flowType);
    const isWithdrawPending = !!actionPendingTransaction;
    const { displayedPendingTransaction, isSheetPresented, handleSheetDismissed } =
        useYieldPendingSheet(actionPendingTransaction);
    const { explorerUrl, openInBlockchain } = useTransactionDetails({
        accountKey: account?.key ?? null,
        txid: displayedPendingTransaction?.txid ?? null,
    });
    const isSubmitDisabled =
        !amount ||
        isWithdrawPending ||
        isAmountTooHigh ||
        isAmountValidationErrorDisplayed ||
        !isWithdrawReviewReady ||
        isComposingWithdrawFee ||
        isFeeUnavailable ||
        messageSystem.isDisabled;

    useYieldPendingTransactionTracking({
        account,
        flowKey,
        flowType,
        pendingTransaction: actionPendingTransaction,
        vault,
    });

    useEffect(() => {
        if (!isFocused || !isWithdrawPending) {
            closePendingBottomSheet();

            return;
        }

        openPendingBottomSheet();
    }, [closePendingBottomSheet, isFocused, isWithdrawPending, openPendingBottomSheet]);

    useEffect(() => {
        // Wait for sheet dismissal to avoid a Fabric crash (see useYieldPendingSheet).
        if (isSheetPresented) {
            return;
        }

        if (session?.step === 'unwrap') {
            navigation.replace(YieldStackRoutes.YieldWithdrawUnwrap, {
                ...route.params,
                withdrawFlowType: flowType,
            });

            return;
        }

        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldWithdrawComplete, {
                ...route.params,
                withdrawFlowType: flowType,
            });
        }
    }, [flowType, isSheetPresented, navigation, route.params, session?.step]);

    const getSharesAmountFromAssetAmount = useCallback(
        (value: string) => {
            if (resolutionStatus !== 'resolved') {
                return '';
            }

            return (
                getWithdrawRequestAmount({
                    networkSymbol: account.symbol,
                    amount: value,
                    token: vault.token,
                    receiptToken: flowData.receiptToken,
                    pricePerShare: vault.state?.pricePerShareState?.price,
                }) ?? ''
            );
        },
        [account, flowData, resolutionStatus, vault],
    );

    const getAssetAmountFromSharesAmount = useCallback(
        (value: string) => {
            if (resolutionStatus !== 'resolved') {
                return '';
            }

            return getConvertedOutputTokenBalanceToInputTokenAmount({
                networkSymbol: account.symbol,
                token: vault.token,
                outputToken: vault.outputToken,
                outputTokenBalance: value,
                pricePerShareState: vault.state?.pricePerShareState,
            });
        },
        [account, resolutionStatus, vault],
    );

    const handleMaxChange = useCallback(
        (value: boolean) => {
            if (!value) {
                setIsMaxSelected(false);
                setAssetAmount('');
                setSharesAmount('');
                setIsMaxWithdrawInfoVisible(false);

                return;
            }

            if (!depositedAmount || !depositedSharesAmount) {
                return;
            }

            setIsMaxSelected(true);

            reportInteraction({
                element: 'withdraw-max',
                value: isSharesInput ? 'shares' : 'asset',
            });

            // Max switches inputs, so release the keyboard from the current one.
            Keyboard.dismiss();

            setAssetAmount(depositedAmount);
            setSharesAmount(depositedSharesAmount);

            if (isSharesInput) {
                return;
            }

            // Redeem all shares to avoid leaving yield dust.
            setFlowType('redeem');
            setIsMaxWithdrawInfoVisible(true);
        },
        [depositedAmount, depositedSharesAmount, isSharesInput, reportInteraction],
    );

    const handleAmountChange = useCallback(
        (value: string) => {
            if (!flowData) {
                return;
            }

            setIsMaxWithdrawInfoVisible(false);

            const transformedValue = decimalTransformer(value);

            if (!transformedValue) {
                setAssetAmount('');
                setSharesAmount('');

                return;
            }

            const inputDecimals = isSharesInput
                ? vault?.outputToken?.decimals
                : flowData.token.decimals;

            if (
                inputDecimals != null &&
                !isAmountInputValueValid({ value: transformedValue, decimals: inputDecimals })
            ) {
                return;
            }

            if (isSharesInput) {
                setSharesAmount(transformedValue);
                setAssetAmount(getAssetAmountFromSharesAmount(transformedValue));

                return;
            }

            setAssetAmount(transformedValue);
            setSharesAmount(getSharesAmountFromAssetAmount(transformedValue));
        },
        [
            flowData,
            getAssetAmountFromSharesAmount,
            getSharesAmountFromAssetAmount,
            isSharesInput,
            vault?.outputToken?.decimals,
        ],
    );

    const handleClose = useCallback(() => {
        if (isWithdrawPending) {
            openPendingBottomSheet();

            return;
        }

        navigation.goBack();
    }, [isWithdrawPending, navigation, openPendingBottomSheet]);

    const handleInputSwitch = useCallback(
        (activeView: 'primary' | 'secondary') => {
            reportInteraction({
                element: 'withdraw-unit-toggle',
                value: activeView === 'secondary' ? 'shares' : 'asset',
            });

            setIsMaxWithdrawInfoVisible(false);
            setFlowType(getYieldWithdrawFlowTypeByInputView(activeView));
        },
        [reportInteraction],
    );

    const handleContinue = useCallback(() => {
        if (!flowKey || !isWithdrawReviewReady || !preparedAction || messageSystem.isDisabled) {
            return;
        }

        const apyBreakdown = getApyBreakdown(vault?.rewardRate?.components);

        reportWithdraw({
            action: 'continue',
            type: 'withdraw',
            operation: flowType,
            wrappedNative: isWrappedNativeVault,
            ...(apyBreakdown && { apyBreakdown }),
        });

        dispatch(yieldActions.discardTransaction());
        dispatch(
            yieldActions.storeActionReviewData({
                amount: preparedAction.amount,
                flowKey,
                flowType,
                receiptAmount: preparedAction.amount,
                unsignedTransaction: preparedAction.unsignedTransaction,
            }),
        );
        navigation.navigate(YieldStackRoutes.YieldWithdrawReview, {
            ...route.params,
            withdrawFlowType: flowType,
        });
    }, [
        dispatch,
        flowType,
        flowKey,
        messageSystem.isDisabled,
        isWithdrawReviewReady,
        isWrappedNativeVault,
        navigation,
        preparedAction,
        reportWithdraw,
        route.params,
        vault,
    ]);

    if (yieldFlowData.resolutionStatus !== 'resolved' || !activeInputToken) {
        return { status: 'loading' as const };
    }

    const resolvedAccount = yieldFlowData.account;
    const resolvedVault = yieldFlowData.vault;
    const underlyingTokenSymbol = toTokenSymbol(yieldFlowData.flowData.token.symbol);
    const vaultTokenSymbol = toTokenSymbol(yieldFlowData.flowData.receiptToken.symbol);
    const activeUnitSymbol = toTokenSymbol(activeInputToken.symbol);
    const activeUnitTokenContract = activeInputToken.contractAddress
        ? toTokenAddress(activeInputToken.contractAddress)
        : undefined;
    const vaultTokenContract = resolvedVault.outputToken?.address
        ? toTokenAddress(resolvedVault.outputToken.address)
        : undefined;
    const headerTokenContract = resolvedVault.token.address
        ? toTokenAddress(resolvedVault.token.address)
        : route.params.tokenContract;

    return {
        status: 'ready' as const,
        yieldFlowData,
        tokenContract: route.params.tokenContract,
        accountLabel: resolvedAccount.accountLabel ?? getNetwork(resolvedAccount.symbol).name,
        isInteractionBlocked: isWithdrawPending,
        disabledAlert: messageSystem.isDisabled
            ? { content: messageSystem.content, variant: messageSystem.variant }
            : null,
        header: {
            tokenContract: headerTokenContract,
            onClose: handleClose,
        },
        stepCard: {
            hasUnwrapStep: isWrappedNativeVault,
        },
        amountForm: {
            assetAmount,
            sharesAmount,
            isSharesInput,
            isMaxSelected,
            onAmountChange: handleAmountChange,
            onInputSwitch: handleInputSwitch,
            onMaxChange: handleMaxChange,
            validationError: amountValidationError,
            underlyingTokenSymbol,
            vaultTokenSymbol,
        },
        depositedRow: maxAmount
            ? {
                  amount: maxAmount,
                  tokenContract: activeUnitTokenContract,
                  tokenDecimals: activeInputToken.decimals,
                  tokenSymbol: activeUnitSymbol,
                  approximateAmount: assetAmount || (depositedAmount ?? ''),
              }
            : null,
        feeEstimationError: hasFeeEstimationError
            ? { onRetry: withdrawFees.retryFeeEstimation }
            : null,
        feeSelector: withdrawFeeFormDraft
            ? {
                  formDraft: withdrawFeeFormDraft,
                  formDraftKey: withdrawFees.formDraftKey,
                  selectedFee: withdrawFees.selectedFee,
                  updateFeeLevelThunk: withdrawFees.updateFeeLevelThunk,
              }
            : null,
        warning: {
            isAmountTooHigh: !isAmountValidationErrorDisplayed && isAmountTooHigh,
            isMaxWithdrawInfoVisible,
            shouldShowNetworkFeeWarning:
                !isAmountValidationErrorDisplayed && shouldShowNetworkFeeWarning,
        },
        footer: {
            isDisabled: isSubmitDisabled,
            isLoading: isComposingWithdrawFee,
            onContinue: handleContinue,
        },
        pendingModal: displayedPendingTransaction
            ? {
                  pendingTransaction: displayedPendingTransaction,
                  bottomSheetRef: pendingBottomSheetRef,
                  onDismiss: handleSheetDismissed,
                  isExploreDisabled: !explorerUrl,
                  onExplorePress: openInBlockchain,
                  amountTokenContract: activeUnitTokenContract,
                  amountTokenSymbol: activeUnitSymbol,
                  vaultTokenContract,
              }
            : null,
    };
};
