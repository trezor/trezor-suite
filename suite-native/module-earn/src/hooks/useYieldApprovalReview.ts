import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { StackActions, useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import {
    type StablecoinYieldRootState,
    type YieldFlowResolvedData,
    formDraftActions,
    handleYieldApproveSuccessTxidThunk,
    pushSendFormTransactionThunk,
    selectIsMevProtectionEnabled,
    selectStablecoinYieldSession,
    sendFormActions,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import type {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { selectIsTransactionAlreadySigned } from '@suite-native/transaction-management';

import { useShowDeviceDisconnectedDuringEarnReviewAlert } from './useShowDeviceDisconnectedDuringEarnReviewAlert';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';
import { useYieldApprovalReviewNavigation } from './useYieldApprovalReviewNavigation';
import { useYieldApprovalReviewTransaction } from './useYieldApprovalReviewTransaction';
import {
    type YieldAllowanceFormDraftTransactionType,
    type YieldApprovalLimitType,
    type YieldReviewSigningResult,
} from '../types';
import { handleEarnReviewError, isUserCancelledSignError } from '../utils';
import { getYieldAllowanceFormDraftKey } from '../yieldApprovalThunks';

type UseYieldApprovalReviewParams = {
    approvalLimitType?: YieldApprovalLimitType;
    flowData: YieldFlowResolvedData;
    flowKey: string;
    onReviewLeave?: () => void;
    transactionType: YieldAllowanceFormDraftTransactionType;
};

type UseYieldApprovalReviewResult = {
    handleApprovalSubmitted: () => Promise<void>;
    isApprovalSigned: boolean;
    isApprovalReviewReady: boolean;
    isSendingApproval: boolean;
    isSigningApproval: boolean;
    leaveReviewFromDeviceCancel: () => void;
    startApprovalReview: () => Promise<YieldReviewSigningResult>;
};

type NavigationProps = StackToStackCompositeNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositApprovalReview | YieldStackRoutes.YieldDepositRevokeReview,
    RootStackParamList
>;

export const useYieldApprovalReview = ({
    approvalLimitType,
    flowData,
    flowKey,
    onReviewLeave,
    transactionType,
}: UseYieldApprovalReviewParams): UseYieldApprovalReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();
    const reviewAlertType = transactionType === 'revoke' ? 'yield-revoke' : 'yield-approval';
    const { showPendingTransactionConflictAlert, showPushTransactionFailedAlert } =
        useShowPushTransactionFailedDuringReviewAlert(reviewAlertType);
    const formDraftKey = useMemo(
        () => getYieldAllowanceFormDraftKey(flowKey, transactionType),
        [flowKey, transactionType],
    );
    const [isSigningApproval, setIsSigningApproval] = useState(false);
    const [isSendingApproval, setIsSendingApproval] = useState(false);

    const isApprovalSigned = useSelector(selectIsTransactionAlreadySigned);
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);
    const isMevProtectionFeatureEnabled = useSelector(selectIsMevProtectionFeatureEnabled);
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSession(state, 'deposit', flowKey),
    );
    const { approval } = session;

    const reviewTransaction = useYieldApprovalReviewTransaction({
        accountKey: flowData.account.key,
    });

    const isPreparingApproval = approval.isSubmitting || !reviewTransaction;
    const isApprovalReviewReady = !isPreparingApproval && !isApprovalSigned;
    const shouldConfirmApprovalCancellation =
        isSigningApproval || isApprovalSigned || isSendingApproval;

    const { leaveReviewFromDeviceCancel, markReviewNavigationSuccess } =
        useYieldApprovalReviewNavigation({
            flowKey,
            onReviewLeave,
            shouldConfirmCancellation: shouldConfirmApprovalCancellation,
            transactionType,
        });

    const startApprovalReview = useCallback(async (): Promise<YieldReviewSigningResult> => {
        if (isApprovalSigned) {
            return 'signed';
        }

        if (isSigningApproval) {
            return 'already-running';
        }

        if (!reviewTransaction) {
            return 'not-ready';
        }

        const { formState, precomposedTransaction } = reviewTransaction;

        setIsSigningApproval(true);

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount: flowData.account,
                }),
            ),
        );

        if (!deviceAccessResponse.success) {
            setIsSigningApproval(false);
            handleEarnReviewError({
                payload: {
                    error: 'sign-transaction-failed',
                    message: 'Prioritized device access failed.',
                },
                navigation,
                showPushTransactionFailedAlert,
                showPendingTransactionConflictAlert,
                showDeviceDisconnectedAlert,
            });

            return 'failed';
        }

        const signTransactionResponse = deviceAccessResponse.payload;

        if (isRejected(signTransactionResponse)) {
            setIsSigningApproval(false);

            if (isUserCancelledSignError(signTransactionResponse.payload)) {
                return 'cancelled';
            }

            handleEarnReviewError({
                payload: signTransactionResponse.payload,
                navigation,
                showPushTransactionFailedAlert,
                showPendingTransactionConflictAlert,
                showDeviceDisconnectedAlert,
            });

            return 'failed';
        }

        setIsSigningApproval(false);

        return 'signed';
    }, [
        dispatch,
        flowData.account,
        isApprovalSigned,
        isSigningApproval,
        navigation,
        reviewTransaction,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    const handleApprovalSubmitted = useCallback(async () => {
        if (!isApprovalSigned || isSendingApproval) {
            return;
        }

        setIsSendingApproval(true);

        const pushResponse = await dispatch(
            pushSendFormTransactionThunk({
                selectedAccount: flowData.account,
                isMevProtectionEnabled: isMevProtectionEnabled && isMevProtectionFeatureEnabled,
            }),
        );

        if (isRejected(pushResponse)) {
            setIsSendingApproval(false);
            handleEarnReviewError({
                payload: pushResponse.payload,
                navigation,
                showPushTransactionFailedAlert,
                showPendingTransactionConflictAlert,
                showDeviceDisconnectedAlert,
            });

            return;
        }

        const { txid } = pushResponse.payload.payload;

        const submittedAt = Date.now();

        await dispatch(
            handleYieldApproveSuccessTxidThunk({
                flowType: 'deposit',
                flowKey,
                txid,
                fee: reviewTransaction?.precomposedTransaction.fee,
                submittedAt,
                isAmountUnlimited:
                    transactionType === 'approve' && approvalLimitType === 'unlimited',
            }),
        );
        dispatch(formDraftActions.removeDraft({ key: formDraftKey }));
        dispatch(sendFormActions.discardTransaction());
        setIsSendingApproval(false);
        markReviewNavigationSuccess();
        navigation.dispatch(StackActions.pop(1));
    }, [
        approvalLimitType,
        dispatch,
        flowData.account,
        flowKey,
        formDraftKey,
        isApprovalSigned,
        isMevProtectionEnabled,
        isMevProtectionFeatureEnabled,
        isSendingApproval,
        markReviewNavigationSuccess,
        navigation,
        reviewTransaction?.precomposedTransaction.fee,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        transactionType,
    ]);

    return {
        handleApprovalSubmitted,
        isApprovalSigned,
        isApprovalReviewReady,
        isSendingApproval,
        isSigningApproval,
        leaveReviewFromDeviceCancel,
        startApprovalReview,
    };
};
