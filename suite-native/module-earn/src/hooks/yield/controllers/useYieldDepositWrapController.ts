import { useCallback, useEffect } from 'react';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    getMaxWrapAmount,
    getYieldVaultContractAddress,
    shouldRecommendWrapReserve,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { useMessageSystemWrappedNative } from '../../earn/useMessageSystemWrappedNative';
import { useMessageSystemYield } from '../useMessageSystemYield';
import { useYieldCurrencyToggleAnalytics } from '../useYieldCurrencyToggleAnalytics';
import { useYieldFlowAnalytics } from '../useYieldFlowAnalytics';
import { useYieldFlowData } from '../useYieldFlowData';
import { useYieldWrappedNativeStep } from '../useYieldWrappedNativeStep';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositWrap>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldDepositWrap>;

export const useYieldDepositWrapController = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const isFocused = useIsFocused();

    const yieldFlowData = useYieldFlowData(route.params);
    const { account, flowKey, isWrappedNativeVault, vault } = yieldFlowData;

    const { reportDeposit, reportInteraction } = useYieldFlowAnalytics({
        networkSymbol: account?.symbol,
        vaultId: vault?.id,
    });

    const vaultContractAddress = vault ? getYieldVaultContractAddress(vault) : undefined;
    const reportCurrencyToggle = useYieldCurrencyToggleAnalytics({
        networkSymbol: account?.symbol,
        vaultId: vault?.id,
    });

    // Attribute this wrap step to the deposit flow in analytics.
    const reportMaxSelected = useCallback(
        () => reportInteraction({ element: 'deposit-max' }),
        [reportInteraction],
    );

    const depositMessageSystem = useMessageSystemYield('deposit', { vaultContractAddress });
    const wrapMessageSystem = useMessageSystemWrappedNative('wrap');

    const nativeSymbol = toTokenSymbol(account ? getNetworkDisplaySymbol(account.symbol) : '');
    const nativeBalance = account?.formattedBalance ?? '0';

    const handleSkipAnalytics = useCallback(
        () => reportDeposit({ action: 'cancel', type: 'wrap' }),
        [reportDeposit],
    );

    const handleSubmitAnalytics = useCallback(
        () => reportDeposit({ action: 'continue', type: 'wrap' }),
        [reportDeposit],
    );

    const handleNavigateToReview = useCallback(() => {
        navigation.navigate(YieldStackRoutes.YieldDepositWrapReview, route.params);
    }, [navigation, route.params]);

    const step = useYieldWrappedNativeStep({
        account,
        availableBalance: nativeBalance,
        decimals: account ? getNetwork(account.symbol).decimals : 0,
        flowKey,
        flowType: 'deposit',
        isDisabled: wrapMessageSystem.isDisabled || depositMessageSystem.isDisabled,
        isWrappedNativeVault,
        onNavigateToReview: handleNavigateToReview,
        onSkipAnalytics: handleSkipAnalytics,
        onSubmitAnalytics: handleSubmitAnalytics,
        step: 'wrap',
        tokenSymbol: nativeSymbol,
        vault,
    });
    const { amountValue, fees, session, simulation } = step;

    useEffect(() => {
        if (!isFocused || !session) {
            return;
        }

        if (session.step === 'approve') {
            navigation.replace(YieldStackRoutes.YieldDepositApproval, route.params);

            return;
        }

        if (session.step === 'action') {
            navigation.replace(YieldStackRoutes.YieldDeposit, route.params);
        }
    }, [isFocused, navigation, route.params, session]);

    if (yieldFlowData.resolutionStatus !== 'resolved' || !isWrappedNativeVault) {
        return { status: 'loading' as const };
    }

    const resolvedAccount = yieldFlowData.account;
    const depositAlert = depositMessageSystem.isDisabled
        ? { content: depositMessageSystem.content, variant: depositMessageSystem.variant }
        : null;
    const wrapAlert = wrapMessageSystem.isDisabled
        ? { content: wrapMessageSystem.content, variant: wrapMessageSystem.variant }
        : null;
    const resolvedToken = yieldFlowData.token;
    const hasWrappedTokenBalance = isPositiveBalance(resolvedToken.balance);
    const isSubmitDisabled =
        !step.isAmountReady ||
        !fees.isFeeReady ||
        !step.isStepSessionReady ||
        step.isStepPending ||
        depositMessageSystem.isDisabled ||
        wrapMessageSystem.isDisabled;

    return {
        status: 'ready' as const,
        yieldFlowData,
        tokenContract: route.params.tokenContract,
        accountLabel: resolvedAccount.accountLabel ?? getNetwork(resolvedAccount.symbol).name,
        nativeSymbol,
        wrappedTokenSymbol: toTokenSymbol(resolvedToken.symbol),
        isInteractionBlocked: step.isStepPending,
        disabledAlerts: [
            ...(depositAlert ? [{ type: 'deposit' as const, ...depositAlert }] : []),
            ...(wrapAlert ? [{ type: 'wrap' as const, ...wrapAlert }] : []),
        ],
        header: {
            onClose: step.handleClose,
        },
        form: step.form,
        amountInput: {
            balance: nativeBalance,
            maxAmount: getMaxWrapAmount(nativeBalance),
            onCurrencyChange: reportCurrencyToggle,
            onMaxPress: reportMaxSelected,
        },
        receivingCard: {
            isVisible: step.isAmountReady,
            amount: amountValue ?? '0',
            tokenContract: toTokenAddress(resolvedToken.contractAddress ?? ''),
            tokenDecimals: resolvedToken.decimals,
        },
        isReserveRecommended: shouldRecommendWrapReserve(amountValue ?? '', nativeBalance),
        isDeviceNotConnectedVisible: simulation.isDeviceNotConnectedVisible,
        isFirmwareOutdatedVisible: simulation.isFirmwareOutdatedVisible,
        feeSection: {
            isVisible: step.isFeeSectionDisplayed,
            fees,
        },
        footer: {
            isSubmitDisabled,
            isSubmitLoading: fees.isFeePreparing,
            onSkip: hasWrappedTokenBalance && !step.isStepPending ? step.handleSkip : undefined,
            onSubmit: simulation.handleSubmit,
        },
        pendingModal:
            step.pendingTransaction && step.pendingModalProps
                ? {
                      pendingTransaction: step.pendingTransaction,
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
