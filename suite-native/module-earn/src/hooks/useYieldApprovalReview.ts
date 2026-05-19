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
import { type YieldApprovalLimitType } from '../types';
import { handleEarnReviewError } from '../utils';
import { getYieldApprovalFormDraftKey } from '../yieldApprovalThunks';

type UseYieldApprovalReviewParams = {
    approvalLimitType: YieldApprovalLimitType;
    flowData: YieldFlowResolvedData;
    flowKey: string;
};

type UseYieldApprovalReviewResult = {
    fee: string;
    handleApprovalSubmitted: () => Promise<void>;
    handleSubmitApprovalReview: () => Promise<void>;
    isApprovalSigned: boolean;
    isPreparingApproval: boolean;
    isSendingApproval: boolean;
    isSigningApproval: boolean;
    isSubmitDisabled: boolean;
};

type NavigationProps = StackToStackCompositeNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositApprovalReview,
    RootStackParamList
>;

export const useYieldApprovalReview = ({
    approvalLimitType,
    flowData,
    flowKey,
}: UseYieldApprovalReviewParams): UseYieldApprovalReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();
    const { showPendingTransactionConflictAlert, showPushTransactionFailedAlert } =
        useShowPushTransactionFailedDuringReviewAlert('yield-approval');
    const formDraftKey = useMemo(() => getYieldApprovalFormDraftKey(flowKey), [flowKey]);
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
    const isSubmitDisabled = isPreparingApproval || isApprovalSigned;
    const shouldConfirmApprovalCancellation =
        isSigningApproval || isApprovalSigned || isSendingApproval;

    useYieldApprovalReviewNavigation({
        flowKey,
        shouldConfirmCancellation: shouldConfirmApprovalCancellation,
    });

    const handleSubmitApprovalReview = useCallback(async () => {
        if (!reviewTransaction || isSigningApproval) {
            return;
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

            return;
        }

        const signTransactionResponse = deviceAccessResponse.payload;

        if (isRejected(signTransactionResponse)) {
            setIsSigningApproval(false);
            handleEarnReviewError({
                payload: signTransactionResponse.payload,
                navigation,
                showPushTransactionFailedAlert,
                showPendingTransactionConflictAlert,
                showDeviceDisconnectedAlert,
            });

            return;
        }

        setIsSigningApproval(false);
    }, [
        dispatch,
        flowData.account,
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
                isAmountUnlimited: approvalLimitType === 'unlimited',
            }),
        );
        dispatch(formDraftActions.removeDraft({ key: formDraftKey }));
        setIsSendingApproval(false);
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
        navigation,
        reviewTransaction?.precomposedTransaction.fee,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    return {
        fee: reviewTransaction?.precomposedTransaction.fee ?? '0',
        handleApprovalSubmitted,
        handleSubmitApprovalReview,
        isApprovalSigned,
        isPreparingApproval,
        isSendingApproval,
        isSigningApproval,
        isSubmitDisabled,
    };
};
