import { useCallback, useEffect, useMemo, useState } from 'react';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { useDispatch } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    REVOKE_ALLOWANCE_AMOUNT,
    submitYieldRevokeThunk,
    yieldActions,
} from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { useRefreshYieldDepositAllowanceOnIdle } from './useRefreshYieldDepositAllowanceOnIdle';
import { useShowYieldAlert } from './useShowYieldAlert';
import { useShowYieldTransactionFailureAlert } from './useShowYieldTransactionFailureAlert';
import { type YieldAllowanceFeeTransaction, useYieldAllowanceFees } from './useYieldAllowanceFees';
import { useYieldApprovedAmountDisplay } from './useYieldApprovedAmountDisplay';
import { useYieldFlowData } from './useYieldFlowData';
import { useYieldPendingTransaction } from './useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from './useYieldPendingTransactionTracking';
import { useYieldSession } from './useYieldSession';
import { prepareYieldAllowanceReviewTransactionThunk } from '../../thunks/yieldApprovalThunks';
import { isYieldApprovalAllowanceUnlimited } from '../../utils/yield/yieldApprovalUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositRevoke>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositRevoke
>;

export const useYieldDepositRevokeScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const showYieldAlert = useShowYieldAlert();
    const yieldFlowData = useYieldFlowData(route.params);
    const {
        account,
        flowData,
        flowKey,
        providerName,
        token,
        tokenSymbol,
        vaultTokenName,
        resolutionStatus,
    } = yieldFlowData;
    const session = useYieldSession({
        flowKey,
        flowType: 'deposit',
    });
    const allowanceAmount = session?.approval.allowanceAmount;
    const allowanceStatus = session?.approval.allowanceStatus;
    const approvalModalState = session?.approval.modalState;
    const {
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: revokePendingTransaction,
    } = useYieldPendingTransaction({
        accountKey: account?.key,
        isFocused,
        pendingTransaction: session?.action.pendingTransaction,
        transactionType: 'revoke',
    });
    const isApprovedAmountUnlimited = isYieldApprovalAllowanceUnlimited({ session, token });
    const intendedDepositAmount = route.params.amount ?? session?.action.amount ?? undefined;
    const revokeRequestAmount = intendedDepositAmount ?? allowanceAmount ?? '';
    const approvedAllowanceAmount = allowanceAmount ?? '';
    const [hasRequestedRevokePreparation, setHasRequestedRevokePreparation] = useState(false);
    const [hasShownMissingAmountError, setHasShownMissingAmountError] = useState(false);
    const [hasShownRevokePreparationError, setHasShownRevokePreparationError] = useState(false);
    const [isPreparingReview, setIsPreparingReview] = useState(false);
    const isPreparingRevoke = session?.approval.isSubmitting ?? false;
    const hasRevokeRequestAmount = isPositiveBalance(revokeRequestAmount);
    const shouldShowLowLimitWarning = !!route.params.shouldShowLowLimitWarning;
    const { formattedApprovedAmount, hasApprovedAmount: hasApprovedAllowanceAmount } =
        useYieldApprovedAmountDisplay({
            allowanceAmount: approvedAllowanceAmount,
            isApprovedAmountUnlimited,
            tokenSymbol,
        });
    const revokeFeeTransaction = useMemo<YieldAllowanceFeeTransaction | null>(() => {
        if (!approvalModalState || approvalModalState.txType === 'approve') {
            return null;
        }

        return {
            allowanceAmount: REVOKE_ALLOWANCE_AMOUNT,
            modalState: approvalModalState,
        };
    }, [approvalModalState]);
    const canComposeRevokeFee = revokePendingTransaction === undefined;
    const {
        formDraft: revokeFeeFormDraft,
        formDraftKey: revokeFeeFormDraftKey,
        isAllowanceFeeReady,
        isComposingAllowanceFee,
        selectedFee: selectedRevokeFee,
        updateFeeLevelThunk: updateRevokeFeeLevelThunk,
    } = useYieldAllowanceFees({
        flowData,
        flowKey,
        draftTransactionType: 'revoke',
        isEnabled: canComposeRevokeFee,
        transaction: revokeFeeTransaction,
    });
    const isRevokeScreenBusy =
        revokePendingTransaction !== undefined || isPreparingReview || isPreparingRevoke;
    const hasPreparedRevokeTransaction = revokeFeeTransaction !== null;
    const isRevokeFeeReadyForReview = hasPreparedRevokeTransaction && isAllowanceFeeReady;
    const shouldPrepareRevokeTransaction =
        hasApprovedAllowanceAmount &&
        hasRevokeRequestAmount &&
        !hasRequestedRevokePreparation &&
        !isPreparingRevoke &&
        revokePendingTransaction === undefined &&
        !hasPreparedRevokeTransaction;
    const canReviewRevoke =
        hasApprovedAllowanceAmount && isRevokeFeeReadyForReview && !isRevokeScreenBusy;
    const isSubmitDisabled = !canReviewRevoke;
    const isSubmitLoading = isPreparingReview || isPreparingRevoke || isComposingAllowanceFee;
    useShowYieldTransactionFailureAlert({
        error: session?.error,
        flowKey,
        flowType: 'deposit',
        isEnabled: isFocused,
    });

    const shouldShowRevokePreparationError =
        hasRequestedRevokePreparation &&
        !isPreparingRevoke &&
        !hasPreparedRevokeTransaction &&
        !!session?.error;
    const shouldShowMissingAmountError =
        resolutionStatus === 'resolved' &&
        allowanceStatus === 'loaded' &&
        !hasApprovedAllowanceAmount &&
        revokePendingTransaction === undefined;

    const handleRevokeConfirmed = useCallback(() => {
        if (resolutionStatus !== 'resolved') {
            return;
        }

        dispatch(
            yieldActions.enterModifyMode({
                flowType: 'deposit',
                flowKey,
                amount: intendedDepositAmount,
            }),
        );
        navigation.replace(YieldStackRoutes.YieldDepositApproval, {
            accountKey: route.params.accountKey,
            tokenContract: route.params.tokenContract,
            yieldId: route.params.yieldId,
        });
    }, [
        dispatch,
        flowKey,
        intendedDepositAmount,
        navigation,
        resolutionStatus,
        route.params.accountKey,
        route.params.tokenContract,
        route.params.yieldId,
    ]);
    const handleMissingAmountAlertPress = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    useYieldPendingTransactionTracking({
        account,
        flowKey,
        flowType: 'deposit',
        isScreenFocused: isFocused,
        onRevokeConfirmed: handleRevokeConfirmed,
        pendingTransaction: revokePendingTransaction,
        vault: yieldFlowData.vault,
    });

    useRefreshYieldDepositAllowanceOnIdle({
        allowanceStatus,
        yieldFlowData,
    });

    useEffect(() => {
        if (!isFocused || !shouldShowMissingAmountError || hasShownMissingAmountError) {
            return;
        }

        setHasShownMissingAmountError(true);
        showYieldAlert({
            title: 'earn.yieldDepositFlowScreen.alerts.revokeUnavailable.title',
            description: 'earn.yieldDepositFlowScreen.alerts.revokeUnavailable.description',
            primaryButtonTitle: 'generic.buttons.goBack',
            onPressPrimaryButton: handleMissingAmountAlertPress,
        });
    }, [
        handleMissingAmountAlertPress,
        hasShownMissingAmountError,
        isFocused,
        shouldShowMissingAmountError,
        showYieldAlert,
    ]);

    useEffect(() => {
        if (
            !isFocused ||
            resolutionStatus !== 'resolved' ||
            !shouldShowRevokePreparationError ||
            hasShownRevokePreparationError
        ) {
            return;
        }

        setHasShownRevokePreparationError(true);
        showYieldAlert({
            title: 'earn.yieldDepositFlowScreen.alerts.revokeUnavailable.title',
            description: 'earn.yieldDepositFlowScreen.alerts.revokeUnavailable.description',
            primaryButtonTitle: 'generic.buttons.tryAgain',
            onPressPrimaryButton: () => {
                dispatch(yieldActions.clearError({ flowType: 'deposit', flowKey }));
                setHasRequestedRevokePreparation(false);
                setHasShownRevokePreparationError(false);
            },
        });
    }, [
        dispatch,
        flowKey,
        hasShownRevokePreparationError,
        isFocused,
        resolutionStatus,
        shouldShowRevokePreparationError,
        showYieldAlert,
    ]);

    useEffect(() => {
        if (!shouldPrepareRevokeTransaction || resolutionStatus !== 'resolved') {
            return;
        }

        setHasRequestedRevokePreparation(true);
        void dispatch(
            submitYieldRevokeThunk({
                flowData,
                flowKey,
                flowType: 'deposit',
                amount: revokeRequestAmount,
            }),
        );
    }, [
        dispatch,
        flowData,
        flowKey,
        resolutionStatus,
        revokeRequestAmount,
        shouldPrepareRevokeTransaction,
    ]);

    const handleReviewAndSign = useCallback(async () => {
        if (!canReviewRevoke || resolutionStatus !== 'resolved') {
            return;
        }

        setIsPreparingReview(true);

        try {
            const reviewTransactionResponse = await dispatch(
                prepareYieldAllowanceReviewTransactionThunk({
                    flowData,
                    flowKey,
                    transactionType: 'revoke',
                    tokenContract: route.params.tokenContract,
                }),
            );

            if (!isFulfilled(reviewTransactionResponse)) {
                showYieldAlert({
                    title: 'earn.yieldDepositFlowScreen.alerts.revokeReviewUnavailable.title',
                    description:
                        'earn.yieldDepositFlowScreen.alerts.revokeReviewUnavailable.description',
                });

                return;
            }

            navigation.navigate(YieldStackRoutes.YieldDepositRevokeReview, {
                ...route.params,
                amount: approvedAllowanceAmount,
                isAmountUnlimited: isApprovedAmountUnlimited,
            });
        } finally {
            setIsPreparingReview(false);
        }
    }, [
        approvedAllowanceAmount,
        canReviewRevoke,
        dispatch,
        flowData,
        flowKey,
        isApprovedAmountUnlimited,
        navigation,
        resolutionStatus,
        route.params,
        showYieldAlert,
    ]);

    if (resolutionStatus !== 'resolved' || shouldShowMissingAmountError) {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const feeSelectorProps =
        revokeFeeTransaction !== null
            ? {
                  accountKey: account.key,
                  tokenContract: route.params.tokenContract,
                  updateThunk: updateRevokeFeeLevelThunk,
                  selectedFee: selectedRevokeFee,
                  selectedFeePerUnit: revokeFeeFormDraft?.feePerUnit,
                  formDraft: revokeFeeFormDraft,
                  formDraftKey: revokeFeeFormDraftKey,
              }
            : null;
    const pendingModal =
        revokePendingTransaction && pendingModalProps
            ? {
                  amount: allowanceAmount ?? revokePendingTransaction.amount,
                  amountTokenSymbol: isApprovedAmountUnlimited ? undefined : tokenSymbol,
                  fee: pendingModalProps.fee,
                  isExploreDisabled: pendingModalProps.isExploreDisabled,
                  onExplorePress: pendingModalProps.onExplorePress,
                  submittedAt: pendingModalProps.submittedAt,
                  txid: pendingModalProps.txid,
              }
            : null;

    return {
        account,
        accountLabel,
        feeSelectorProps,
        formattedApprovedAmount,
        handleReviewAndSign,
        isApprovedAmountUnlimited,
        isSubmitDisabled,
        isSubmitLoading,
        pendingBottomSheetRef,
        pendingModal,
        providerName,
        shouldShowLowLimitWarning,
        tokenContract: route.params.tokenContract,
        tokenSymbol,
        vaultTokenName,
    };
};
