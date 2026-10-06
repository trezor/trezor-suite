import { useCallback, useEffect, useMemo } from 'react';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type YieldWithdrawFlowType,
    getConvertedOutputTokenBalanceToInputTokenAmount,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import { useMessageSystemWrappedNative } from '../../earn/useMessageSystemWrappedNative';
import { useYieldCurrencyToggleAnalytics } from '../useYieldCurrencyToggleAnalytics';
import { useYieldFlowAnalytics } from '../useYieldFlowAnalytics';
import { useYieldFlowData } from '../useYieldFlowData';
import { useYieldWrappedNativeStep } from '../useYieldWrappedNativeStep';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldWithdrawUnwrap>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldWithdrawUnwrap
>;

export const useYieldWithdrawUnwrapController = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const isFocused = useIsFocused();

    const flowType: YieldWithdrawFlowType = route.params.withdrawFlowType ?? 'withdraw';

    const yieldFlowData = useYieldFlowData(route.params);
    const { account, flowKey, isWrappedNativeVault, token, vault, resolutionStatus } =
        yieldFlowData;

    const unwrapMessageSystem = useMessageSystemWrappedNative('unwrap');

    const { reportInteraction, reportWithdraw } = useYieldFlowAnalytics({
        networkSymbol: account?.symbol,
        vaultId: vault?.id,
    });

    const reportCurrencyToggle = useYieldCurrencyToggleAnalytics({
        networkSymbol: account?.symbol,
        vaultId: vault?.id,
    });

    // Attribute this unwrap step to the withdraw flow; its amount is always in assets.
    const reportMaxSelected = useCallback(
        () => reportInteraction({ element: 'withdraw-max', value: 'asset' }),
        [reportInteraction],
    );

    const nativeSymbol = toTokenSymbol(account ? getNetworkDisplaySymbol(account.symbol) : '');
    const wrappedBalance = token?.balance ?? '0';

    const handleSkipAnalytics = useCallback(
        () => reportWithdraw({ action: 'cancel', type: 'unwrap', operation: flowType }),
        [flowType, reportWithdraw],
    );

    const handleSubmitAnalytics = useCallback(
        () => reportWithdraw({ action: 'continue', type: 'unwrap', operation: flowType }),
        [flowType, reportWithdraw],
    );

    const handleNavigateToReview = useCallback(() => {
        navigation.navigate(YieldStackRoutes.YieldWithdrawUnwrapReview, route.params);
    }, [navigation, route.params]);

    const step = useYieldWrappedNativeStep({
        account,
        availableBalance: wrappedBalance,
        decimals: token?.decimals ?? 0,
        flowKey,
        flowType,
        isDisabled: unwrapMessageSystem.isDisabled,
        isWrappedNativeVault,
        onNavigateToReview: handleNavigateToReview,
        onSkipAnalytics: handleSkipAnalytics,
        onSubmitAnalytics: handleSubmitAnalytics,
        step: 'unwrap',
        tokenSymbol: token?.symbol ?? '',
        vault,
    });
    const { amountValue, fees, isSheetPresented, session, simulation } = step;

    const completedAmount = session?.result.completedAmount;
    const isUnwrapSessionReady = step.isStepSessionReady;
    const withdrawnAmount = useMemo(() => {
        if (
            resolutionStatus !== 'resolved' ||
            !isUnwrapSessionReady ||
            !completedAmount ||
            !vault.outputToken
        ) {
            return undefined;
        }

        const withdrawnWrappedAmount =
            flowType === 'redeem'
                ? getConvertedOutputTokenBalanceToInputTokenAmount({
                      networkSymbol: account.symbol,
                      token: vault.token,
                      outputToken: vault.outputToken,
                      outputTokenBalance: completedAmount,
                      pricePerShareState: vault.state?.pricePerShareState,
                  })
                : completedAmount;
        const clampedAmount = BigNumber.min(
            new BigNumber(withdrawnWrappedAmount).decimalPlaces(
                token.decimals,
                BigNumber.ROUND_DOWN,
            ),
            wrappedBalance,
        );

        return clampedAmount.gt(0) ? clampedAmount.toFixed() : undefined;
    }, [
        account,
        completedAmount,
        flowType,
        isUnwrapSessionReady,
        resolutionStatus,
        token,
        vault,
        wrappedBalance,
    ]);

    useEffect(() => {
        if (!isFocused) {
            return;
        }

        // Wait for sheet dismissal to avoid a Fabric crash (see useYieldPendingSheet).
        if (isSheetPresented) {
            return;
        }

        if (session?.step === 'action') {
            navigation.replace(YieldStackRoutes.YieldWithdraw, {
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
    }, [flowType, isFocused, isSheetPresented, navigation, route.params, session?.step]);

    if (yieldFlowData.resolutionStatus !== 'resolved' || !isWrappedNativeVault) {
        return { status: 'loading' as const };
    }

    const resolvedAccount = yieldFlowData.account;
    const resolvedToken = yieldFlowData.token;
    const isSubmitDisabled =
        !step.isAmountReady ||
        !fees.isFeeReady ||
        !step.isStepSessionReady ||
        step.isStepPending ||
        unwrapMessageSystem.isDisabled;

    return {
        status: 'ready' as const,
        yieldFlowData,
        tokenContract: route.params.tokenContract,
        accountLabel: resolvedAccount.accountLabel ?? getNetwork(resolvedAccount.symbol).name,
        nativeSymbol,
        wrappedTokenSymbol: toTokenSymbol(resolvedToken.symbol),
        wrappedTokenContract: toTokenAddress(resolvedToken.contractAddress ?? ''),
        isInteractionBlocked: step.isStepPending,
        disabledAlert: unwrapMessageSystem.isDisabled
            ? { content: unwrapMessageSystem.content, variant: unwrapMessageSystem.variant }
            : null,
        header: {
            onClose: step.handleClose,
        },
        form: step.form,
        amountInput: {
            balance: wrappedBalance,
            defaultAmount: withdrawnAmount,
            onCurrencyChange: reportCurrencyToggle,
            onMaxPress: reportMaxSelected,
            tokenDecimals: resolvedToken.decimals,
        },
        receivingCard: {
            isVisible: step.isAmountReady,
            amount: amountValue ?? '',
            tokenDecimals: getNetwork(resolvedAccount.symbol).decimals,
        },
        isDeviceNotConnectedVisible: simulation.isDeviceNotConnectedVisible,
        feeSection: {
            isVisible: step.isFeeSectionDisplayed,
            fees,
        },
        footer: {
            isSubmitDisabled,
            isSubmitLoading: fees.isFeePreparing,
            onSkip: step.isStepPending ? undefined : step.handleSkip,
            onSubmit: simulation.handleSubmit,
        },
        pendingModal:
            step.displayedPendingTransaction && step.pendingModalProps
                ? {
                      pendingTransaction: step.displayedPendingTransaction,
                      modalProps: step.pendingModalProps,
                      bottomSheetRef: step.pendingBottomSheetRef,
                  }
                : null,
        simulationSheet: simulation.preparedTx
            ? {
                  bottomSheetRef: simulation.simulationBottomSheetRef,
                  unsignedTransaction: simulation.preparedTx.unsignedTransaction,
                  onConfirm: simulation.handleConfirmSimulation,
                  onCancel: simulation.handleCancelSimulation,
              }
            : null,
    };
};
