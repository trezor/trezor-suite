import { useCallback } from 'react';
import { Keyboard } from 'react-native';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { getYieldNativeFeeStatus, yieldActions } from '@suite-common/wallet-core';
import { getAllowanceAction, isPositiveBalance } from '@suite-common/wallet-utils';
import { useBottomSheetModal } from '@suite-native/atoms';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { getYieldApprovalAnalyticsType } from '../../../utils/yield/yieldAnalyticsUtils';
import { isYieldApprovalAllowanceUnlimited } from '../../../utils/yield/yieldApprovalUtils';
import { getYieldFeeReserveAlert } from '../../../utils/yield/yieldFeeReserveUtils';
import { useRefreshYieldDepositAllowanceOnIdle } from '../useRefreshYieldDepositAllowanceOnIdle';
import { useReturnToYieldDepositWrapStep } from '../useReturnToYieldDepositWrapStep';
import { useYieldApprovalFees } from '../useYieldApprovalFees';
import { useYieldApprovalLimit } from '../useYieldApprovalLimit';
import { useYieldCurrencyToggleAnalytics } from '../useYieldCurrencyToggleAnalytics';
import { useYieldDepositApprovalSubmit } from '../useYieldDepositApprovalSubmit';
import { useYieldDepositForm } from '../useYieldDepositForm';
import { useYieldDepositGasReserve } from '../useYieldDepositGasReserve';
import { useYieldFlowAnalytics, useYieldFormExitAnalytics } from '../useYieldFlowAnalytics';
import { useYieldPendingTransaction } from '../useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from '../useYieldPendingTransactionTracking';
import { useYieldFlowScreenBase } from './useYieldFlowScreenBase';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositApproval>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositApproval
>;

export const useYieldDepositApprovalController = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { dispatch } = useServices(injectDispatch);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const {
        bottomSheetRef: approvalLimitBottomSheetRef,
        closeModal: closeApprovalLimitBottomSheet,
        openModal: openApprovalLimitBottomSheet,
    } = useBottomSheetModal();

    const { isFocused, messageSystem, session, yieldFlowData } = useYieldFlowScreenBase({
        flowType: 'deposit',
        routeParams: route.params,
        shouldDisposeSessionOnGoBack: true,
    });
    const { account, flowData, flowKey, token, tokenSymbol } = yieldFlowData;

    const { reportDeposit, reportInteraction } = useYieldFlowAnalytics({
        networkSymbol: account?.symbol,
        vaultId: yieldFlowData.vault?.id,
    });
    const reportCurrencyToggle = useYieldCurrencyToggleAnalytics({
        networkSymbol: account?.symbol,
        vaultId: yieldFlowData.vault?.id,
    });
    const isAllowanceAmountUnlimited = isYieldApprovalAllowanceUnlimited({ session, token });
    const defaultApprovalLimitType = isAllowanceAmountUnlimited ? 'unlimited' : 'minimal';
    const { approvalLimitTitle, approvalLimitType, setApprovalLimitType } =
        useYieldApprovalLimit(defaultApprovalLimitType);
    const allowanceAmount = session?.approval.allowanceAmount;
    const allowanceStatus = session?.approval.allowanceStatus;
    const {
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: approvalPendingTransaction,
    } = useYieldPendingTransaction({
        accountKey: account?.key,
        isFocused,
        pendingTransaction: session?.action.pendingTransaction,
        transactionType: 'approve',
        vaultId: yieldFlowData.vault?.id,
    });
    const isApprovalPending = !!approvalPendingTransaction;
    const hasApprovedAmount =
        allowanceAmount !== null && allowanceAmount !== undefined
            ? isPositiveBalance(allowanceAmount)
            : false;
    const shouldShowApprovedAmountCard = allowanceStatus === 'loaded' && hasApprovedAmount;

    const hasWrappedAmount = !!session?.result.wrappedAmount;
    const depositForm = useYieldDepositForm({
        defaultAmount:
            session?.approval.origin === 'modify' || hasWrappedAmount
                ? session?.action.amount
                : undefined,
        token,
        tokenSymbol,
        wrappedAmount: session?.result.wrappedAmount,
    });
    const { amountValue, availableBalance, form, handleMaxPress } = depositForm;
    const handleMaxPressWithAnalytics = useCallback(() => {
        reportInteraction({ element: 'deposit-max' });
        handleMaxPress();
    }, [handleMaxPress, reportInteraction]);
    const {
        formState: { isValid },
    } = form;
    const footerApprovalAction =
        allowanceStatus === 'loaded'
            ? getAllowanceAction({
                  requestedAmount: amountValue ?? '',
                  currentAllowanceAmount: allowanceAmount,
                  shouldConsiderAllowance: hasApprovedAmount,
                  isRevokeRequired: session?.approval.isRevokeRequired ?? false,
                  tokenContractAddress: token?.contractAddress,
              })
            : undefined;
    const approvalFees = useYieldApprovalFees({
        amount: amountValue,
        approvalLimitType,
        flowKey,
        isEnabled: isValid && isFocused && !isApprovalPending,
        flowData,
        tokenContract: route.params.tokenContract,
    });
    const { handleSubmitApproval, isCheckingApproval } = useYieldDepositApprovalSubmit({
        approvalLimitType,
        flowData,
        flowKey,
        routeParams: route.params,
    });

    const gasReserve = useYieldDepositGasReserve({
        account,
        isWrappedNativeVault: yieldFlowData.isWrappedNativeVault,
        tokenContractAddress: token?.contractAddress,
        flowKey,
    });

    const nativeFeeStatus = getYieldNativeFeeStatus({
        nativeBalance: account?.formattedBalance ?? '0',
        reserve: gasReserve,
        isWrapStep: false,
        isWrappedNativeVault: yieldFlowData.isWrappedNativeVault,
    });

    useYieldFormExitAnalytics({
        flowType: 'deposit',
        networkSymbol: account?.symbol,
        vaultId: yieldFlowData.vault?.id,
        isEnabled: yieldFlowData.resolutionStatus === 'resolved',
        isCompleted: session?.step === 'complete',
    });

    const isApprovalSessionReady = session?.step === 'approve';
    const canSkipApproval = isApprovalSessionReady && shouldShowApprovedAmountCard;
    const canSubmitApproval =
        isValid &&
        approvalFees.isAllowanceFeeReady &&
        isApprovalSessionReady &&
        !isApprovalPending &&
        !isCheckingApproval &&
        nativeFeeStatus !== 'insufficient';
    const isSubmitDisabled = !canSubmitApproval || messageSystem.isDisabled;

    useRefreshYieldDepositAllowanceOnIdle({
        allowanceStatus,
        yieldFlowData,
    });

    const returnToWrapStep = useReturnToYieldDepositWrapStep({
        flowKey,
        routeParams: route.params,
    });

    const handleApprovalConfirmed = useCallback(() => {
        navigation.navigate(YieldStackRoutes.YieldDeposit, route.params);
    }, [navigation, route.params]);
    const handleCloseApproval = useCallback(() => {
        const isApprovalRemovedByPopToTop = navigation.getState().routes.length > 1;

        navigateToInitialScreen();

        if (!isApprovalRemovedByPopToTop || !flowKey || isApprovalPending) {
            return;
        }

        dispatch(yieldActions.disposeSession({ flowType: 'deposit', flowKey }));
    }, [dispatch, flowKey, isApprovalPending, navigateToInitialScreen, navigation]);

    const handleSkipApproval = useCallback(() => {
        if (!flowKey || isApprovalPending) {
            return;
        }

        Keyboard.dismiss();
        reportDeposit({ action: 'skip', type: 'approve' });

        dispatch(
            yieldActions.skipApprovalStep({
                flowType: 'deposit',
                flowKey,
                amount: amountValue || undefined,
            }),
        );

        navigation.navigate(YieldStackRoutes.YieldDeposit, route.params);
    }, [
        amountValue,
        dispatch,
        flowKey,
        isApprovalPending,
        navigation,
        reportDeposit,
        route.params,
    ]);

    const handleNavigateToRevoke = useCallback(() => {
        if (!flowKey || isApprovalPending) {
            return;
        }

        Keyboard.dismiss();

        const amount =
            amountValue !== undefined && isPositiveBalance(amountValue) ? amountValue : undefined;

        if (amount) {
            dispatch(
                yieldActions.enterModifyMode({
                    flowType: 'deposit',
                    flowKey,
                    amount,
                }),
            );
        }

        navigation.navigate(YieldStackRoutes.YieldDepositRevoke, {
            ...route.params,
            amount,
        });
    }, [amountValue, dispatch, flowKey, isApprovalPending, navigation, route.params]);

    useYieldPendingTransactionTracking({
        account,
        flowKey,
        flowType: 'deposit',
        isScreenFocused: isFocused,
        onApprovalConfirmed: handleApprovalConfirmed,
        pendingTransaction: approvalPendingTransaction,
        vault: yieldFlowData.vault,
    });

    const handleSubmit = form.handleSubmit(async ({ amount }) => {
        if (isSubmitDisabled) {
            return;
        }

        Keyboard.dismiss();

        if (footerApprovalAction === 'continue') {
            reportDeposit({ action: 'skip', type: 'approve' });
        } else if (footerApprovalAction !== 'revoke') {
            reportDeposit({
                action: 'continue',
                type: 'approve',
                approvalType: getYieldApprovalAnalyticsType(approvalLimitType),
            });
        }

        await handleSubmitApproval(amount);
    });

    if (yieldFlowData.resolutionStatus !== 'resolved') {
        return { status: 'loading' as const };
    }

    return {
        status: 'ready' as const,
        yieldFlowData,
        tokenContract: route.params.tokenContract,
        accountLabel:
            yieldFlowData.account.accountLabel ?? getNetwork(yieldFlowData.account.symbol).name,
        isInteractionBlocked: isApprovalPending,
        disabledAlert: messageSystem.isDisabled
            ? { content: messageSystem.content, variant: messageSystem.variant }
            : null,
        header: {
            onClose: handleCloseApproval,
        },
        stepCard: {
            hasWrapStep: yieldFlowData.isWrappedNativeVault,
            isWrapStepSkipped: !hasWrappedAmount,
            onEditWrapStep: returnToWrapStep,
        },
        approvedAmountCard: {
            isVisible: shouldShowApprovedAmountCard,
            amount: allowanceAmount ?? null,
            isUnlimited: isAllowanceAmountUnlimited,
            onRevoke: handleNavigateToRevoke,
        },
        amountInput: {
            form,
            balance: availableBalance,
            onMaxPress: handleMaxPressWithAnalytics,
            onCurrencyChange: reportCurrencyToggle,
            approvalLimitTitle,
            isApprovalLimitDisabled: isAllowanceAmountUnlimited,
            onApprovalLimitPress: openApprovalLimitBottomSheet,
        },
        isRevokeRequired: footerApprovalAction === 'revoke',
        feeReserveAlert: getYieldFeeReserveAlert({ nativeFeeStatus, gasReserve }),
        feeSection: {
            isVisible: isValid && !!amountValue,
            hasFeeEstimationError: approvalFees.hasFeeEstimationError,
            isComposingFeeLevels: approvalFees.isComposingFeeLevels,
            retryFeeEstimation: approvalFees.retryFeeEstimation,
            formDraft: approvalFees.formDraft,
            formDraftKey: approvalFees.formDraftKey,
            selectedFee: approvalFees.selectedFee,
            updateFeeLevelThunk: approvalFees.updateFeeLevelThunk,
        },
        footer: {
            amountValue,
            approvalAction: footerApprovalAction,
            estimatedRewardsTokenContract: yieldFlowData.isWrappedNativeVault
                ? undefined
                : route.params.tokenContract,
            isDisabled: isSubmitDisabled,
            isLoading: isCheckingApproval,
            isSkipDisabled: isApprovalPending || isCheckingApproval,
            onPress: handleSubmit,
            onSkipPress: canSkipApproval ? handleSkipApproval : undefined,
        },
        pendingModal:
            approvalPendingTransaction && pendingModalProps
                ? {
                      pendingTransaction: approvalPendingTransaction,
                      modalProps: pendingModalProps,
                      bottomSheetRef: pendingBottomSheetRef,
                  }
                : null,
        approvalLimitSheet: {
            bottomSheetRef: approvalLimitBottomSheetRef,
            onClose: closeApprovalLimitBottomSheet,
            onSelect: setApprovalLimitType,
            selectedType: approvalLimitType,
        },
    };
};
