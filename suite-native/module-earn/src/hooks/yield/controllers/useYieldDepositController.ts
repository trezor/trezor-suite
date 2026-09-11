import { useCallback, useEffect } from 'react';

import { type RouteProp, StackActions, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useDispatch } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { yieldActions } from '@suite-common/wallet-core';
import { getApyBreakdown } from '@suite-common/wallet-utils';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import { useYieldFlowScreenBase } from './useYieldFlowScreenBase';
import { useYieldTxSimulationSheet } from './useYieldTxSimulationSheet';
import { isYieldApprovalAllowanceUnlimited } from '../../../utils/yield/yieldApprovalUtils';
import { useNavigateBackAnalytics } from '../../earn/useNavigateBackAnalytics';
import { useRefreshYieldDepositAllowanceOnIdle } from '../useRefreshYieldDepositAllowanceOnIdle';
import { useReturnToYieldDepositWrapStep } from '../useReturnToYieldDepositWrapStep';
import { useYieldCurrencyToggleAnalytics } from '../useYieldCurrencyToggleAnalytics';
import { useYieldDepositFees } from '../useYieldDepositFees';
import { useYieldDepositForm } from '../useYieldDepositForm';
import { useYieldDepositSubmit } from '../useYieldDepositSubmit';
import { useYieldFlowAnalytics } from '../useYieldFlowAnalytics';
import { useYieldPendingTransaction } from '../useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from '../useYieldPendingTransactionTracking';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDeposit>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldDeposit>;

export const useYieldDepositController = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const { isFocused, messageSystem, session, yieldFlowData } = useYieldFlowScreenBase({
        flowType: 'deposit',
        routeParams: route.params,
    });
    const { account, flowData, flowKey, token, tokenSymbol } = yieldFlowData;

    const { reportDeposit, reportInteraction } = useYieldFlowAnalytics({
        networkSymbol: account?.symbol,
        vaultId: yieldFlowData.vault?.id,
    });

    useNavigateBackAnalytics({
        type: events.yieldNavigateEvent.name,
        payload: {
            action: 'cancel',
            from: 'deposit-form',
            to: 'deposit-form',
            networkSymbol: account?.symbol,
            vaultId: yieldFlowData.vault?.id,
        },
    });

    const allowanceAmount = session?.approval.allowanceAmount;
    const allowanceStatus = session?.approval.allowanceStatus;
    const {
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: actionPendingTransaction,
    } = useYieldPendingTransaction({
        accountKey: account?.key,
        isFocused,
        pendingTransaction: session?.action.pendingTransaction,
        transactionType: 'deposit',
    });
    const isDepositPending = !!actionPendingTransaction;
    const isActionSubmitting = session?.action.isSubmitting ?? false;
    const isApprovedAmountUnlimited = isYieldApprovalAllowanceUnlimited({ session, token });
    const isAllowanceLoaded = allowanceStatus === 'loaded';
    const isDepositSessionReady = session?.step === 'action';
    const depositForm = useYieldDepositForm({
        defaultAmount: session?.action.amount,
        token,
        tokenSymbol,
        wrappedAmount: session?.result.wrappedAmount,
    });
    const { amountValue, availableBalance, form, handleMaxPress } = depositForm;
    const {
        formState: { isValid },
    } = form;

    const isApprovalInsufficient =
        isAllowanceLoaded &&
        !!amountValue &&
        !isApprovedAmountUnlimited &&
        new BigNumber(amountValue).gt(allowanceAmount ?? '0');
    const isDepositAmountReady = isValid && !!amountValue;

    const canContinueDepositFlow =
        isDepositSessionReady &&
        isAllowanceLoaded &&
        isDepositAmountReady &&
        !isDepositPending &&
        !isActionSubmitting;
    const canPrepareDepositFee = canContinueDepositFlow && !isApprovalInsufficient;

    const depositFee = useYieldDepositFees({
        amount: amountValue,
        flowData,
        flowKey,
        isEnabled: canPrepareDepositFee,
    });
    const isSubmitDisabled =
        !canContinueDepositFlow ||
        isApprovalInsufficient ||
        !depositFee.isDepositFeeReady ||
        messageSystem.isDisabled;

    useYieldPendingTransactionTracking({
        account,
        flowKey,
        flowType: 'deposit',
        pendingTransaction: actionPendingTransaction,
        vault: yieldFlowData.vault,
    });

    useRefreshYieldDepositAllowanceOnIdle({
        allowanceStatus,
        yieldFlowData,
    });

    const returnToWrapStep = useReturnToYieldDepositWrapStep({
        flowKey,
        routeParams: route.params,
    });

    useEffect(() => {
        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldDepositComplete, route.params);
        }
    }, [navigation, route.params, session?.step]);

    const handleGoBackToApproval = useCallback(() => {
        if (!flowKey || isDepositPending) {
            return;
        }

        reportDeposit({ action: 'continue', type: 'modify-allowance' });

        dispatch(
            yieldActions.enterModifyMode({
                flowType: 'deposit',
                flowKey,
                amount: amountValue || undefined,
            }),
        );

        navigation.dispatch(
            StackActions.popTo(YieldStackRoutes.YieldDepositApproval, route.params),
        );
    }, [amountValue, dispatch, flowKey, isDepositPending, navigation, reportDeposit, route.params]);

    const reportSimulationAction = useCallback(
        (action: 'continue' | 'cancel') => reportDeposit({ action, type: 'tx-simulation-modal' }),
        [reportDeposit],
    );
    const navigateToReview = useCallback(() => {
        navigation.navigate(YieldStackRoutes.YieldDepositReview, route.params);
    }, [navigation, route.params]);
    const simulationSheet = useYieldTxSimulationSheet({
        flowKey,
        flowType: 'deposit',
        onConfirmed: navigateToReview,
        onReportAction: reportSimulationAction,
    });

    const { handleSubmitDeposit } = useYieldDepositSubmit({
        amount: amountValue,
        onActionReady: simulationSheet.openSimulation,
        preparedAction: depositFee.preparedAction,
    });

    const handleContinue = useCallback(() => {
        if (isSubmitDisabled) {
            return;
        }

        const apyBreakdown = getApyBreakdown(yieldFlowData.vault?.rewardRate?.components);

        reportDeposit({
            action: 'continue',
            type: 'deposit',
            wrappedNative: yieldFlowData.isWrappedNativeVault,
            ...(apyBreakdown && { apyBreakdown }),
        });

        handleSubmitDeposit();
    }, [
        handleSubmitDeposit,
        isSubmitDisabled,
        reportDeposit,
        yieldFlowData.isWrappedNativeVault,
        yieldFlowData.vault,
    ]);

    const handleMaxPressWithAnalytics = useCallback(() => {
        reportInteraction({ element: 'deposit-max' });
        handleMaxPress();
    }, [handleMaxPress, reportInteraction]);

    const reportCurrencyToggle = useYieldCurrencyToggleAnalytics({
        networkSymbol: account?.symbol,
        vaultId: yieldFlowData.vault?.id,
    });

    const handleCloseDeposit = useCallback(() => {
        navigateToInitialScreen();

        if (!flowKey || session?.action.pendingTransaction) {
            return;
        }

        dispatch(yieldActions.disposeSession({ flowType: 'deposit', flowKey }));
    }, [dispatch, flowKey, navigateToInitialScreen, session?.action.pendingTransaction]);

    if (yieldFlowData.resolutionStatus !== 'resolved' || !isDepositSessionReady) {
        return { status: 'loading' as const };
    }

    return {
        status: 'ready' as const,
        yieldFlowData,
        tokenContract: route.params.tokenContract,
        accountLabel:
            yieldFlowData.account.accountLabel ?? getNetwork(yieldFlowData.account.symbol).name,
        isInteractionBlocked: isDepositPending,
        disabledAlert: messageSystem.isDisabled
            ? { content: messageSystem.content, variant: messageSystem.variant }
            : null,
        header: {
            onClose: handleCloseDeposit,
        },
        stepCard: {
            hasWrapStep: yieldFlowData.isWrappedNativeVault,
            isApprovalStepSkipped: !!session?.approval.isSkipped,
            isWrapStepSkipped: !session?.result.wrappedAmount,
            onEditWrapStep: returnToWrapStep,
            onEditApprovalStep: handleGoBackToApproval,
        },
        approvedAmountCard: {
            amount: allowanceAmount ?? null,
            isUnlimited: isApprovedAmountUnlimited,
        },
        amountInput: {
            form,
            balance: availableBalance,
            onMaxPress: handleMaxPressWithAnalytics,
            onCurrencyChange: reportCurrencyToggle,
        },
        isApprovalInsufficient,
        feeSection: {
            isVisible: isValid && !!amountValue && !isApprovalInsufficient,
            fees: depositFee,
        },
        footer: {
            amountValue,
            estimatedRewardsTokenContract: yieldFlowData.isWrappedNativeVault
                ? undefined
                : route.params.tokenContract,
            isDisabled: isSubmitDisabled,
            isLoading: isActionSubmitting || depositFee.isPreparingDepositFee,
            onContinue: handleContinue,
        },
        pendingModal:
            actionPendingTransaction && pendingModalProps
                ? {
                      pendingTransaction: actionPendingTransaction,
                      modalProps: pendingModalProps,
                      bottomSheetRef: pendingBottomSheetRef,
                  }
                : null,
        simulationSheet: simulationSheet.preparedAction
            ? {
                  bottomSheetRef: simulationSheet.bottomSheetRef,
                  unsignedTransaction: simulationSheet.preparedAction.unsignedTransaction,
                  onConfirm: simulationSheet.handleConfirm,
                  onCancel: simulationSheet.handleCancel,
              }
            : null,
    };
};
