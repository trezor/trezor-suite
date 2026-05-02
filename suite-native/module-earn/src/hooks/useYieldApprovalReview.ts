import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
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
import { handleEarnReviewError } from '../utils';
import { getYieldApprovalFormDraftKey } from '../yieldApprovalThunks';

type UseYieldApprovalReviewParams = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
};

type UseYieldApprovalReviewResult = {
    fee: string | undefined;
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
    YieldStackRoutes.YieldSupplyApprovalReview,
    RootStackParamList
>;
type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldSupplyApprovalReview>;

export const useYieldApprovalReview = ({
    flowData,
    flowKey,
}: UseYieldApprovalReviewParams): UseYieldApprovalReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<RouteProps>();
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
        selectStablecoinYieldSession(state, 'supply', flowKey),
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
        reviewTransaction,
        navigation,
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

        const handleApproveSuccessResponse = await dispatch(
            handleYieldApproveSuccessTxidThunk({
                flowType: 'supply',
                flowKey,
                txid,
                fee: reviewTransaction?.precomposedTransaction.fee,
                approvalLimitType: route.params.approvalLimitType,
            }),
        );

        if (isRejected(handleApproveSuccessResponse)) {
            setIsSendingApproval(false);
            showPushTransactionFailedAlert();

            return;
        }

        dispatch(formDraftActions.removeDraft({ key: formDraftKey }));
        setIsSendingApproval(false);

        navigation.goBack();
    }, [
        dispatch,
        flowData.account,
        flowKey,
        formDraftKey,
        isApprovalSigned,
        isMevProtectionEnabled,
        isMevProtectionFeatureEnabled,
        isSendingApproval,
        navigation,
        reviewTransaction,
        route.params.approvalLimitType,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    return {
        fee: reviewTransaction?.precomposedTransaction.fee,
        handleApprovalSubmitted,
        handleSubmitApprovalReview,
        isApprovalSigned,
        isPreparingApproval,
        isSendingApproval,
        isSigningApproval,
        isSubmitDisabled,
    };
};
