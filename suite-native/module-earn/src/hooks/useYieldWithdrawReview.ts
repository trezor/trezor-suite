import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import {
    type FormDraftRootState,
    type StablecoinYieldRootState,
    type YieldFlowDisplayToken,
    type YieldFlowResolvedData,
    selectFormDraft,
    selectStablecoinYieldTxReview,
} from '@suite-common/wallet-core';
import { type FormState, isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import type {
    StackNavigationProps,
    YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { type NativeSendRootState, selectFeeLevels } from '@suite-native/transaction-management';

import {
    type YieldReviewActionStatus,
    type YieldReviewSigningResult,
    type YieldReviewStatus,
} from '../types';
import { isUserCancelledSignError } from '../utils';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';
import { useYieldActionReviewBackNavigation } from './useYieldActionReviewBackNavigation';
import { getSelectedEvmFeeFromPrecomposedTransaction } from '../utils/yieldSelectedFeeUtils';
import { getYieldWithdrawFormDraftKey } from '../utils/yieldWithdrawUtils';
import { pushYieldActionReviewThunk, signYieldActionReviewThunk } from '../yieldTransactionThunks';

type UseYieldWithdrawReviewParams = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    onReviewLeave?: () => void;
    reviewToken: YieldFlowDisplayToken;
};

type UseYieldWithdrawReviewResult = {
    handleWithdrawSubmitted: () => Promise<void>;
    leaveReviewFromDeviceCancel: () => void;
    startWithdrawReview: () => Promise<YieldReviewSigningResult>;
    withdrawStatus: YieldReviewStatus;
};

type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldWithdrawReview
>;

export const useYieldWithdrawReview = ({
    flowData,
    flowKey,
    onReviewLeave,
    reviewToken,
}: UseYieldWithdrawReviewParams): UseYieldWithdrawReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const {
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        showSignTransactionFailedAlert,
    } = useShowPushTransactionFailedDuringReviewAlert('yield-withdraw');
    const [withdrawActionStatus, setWithdrawActionStatus] =
        useState<YieldReviewActionStatus>('idle');
    const txReview = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldTxReview(state),
    );
    const formDraftKey = getYieldWithdrawFormDraftKey(flowKey);
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectFormDraft<FormState>(state, formDraftKey),
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));
    const selectedFeeTransaction = formDraft?.selectedFee
        ? feeLevels[formDraft.selectedFee]
        : undefined;
    const selectedFee = useMemo(
        () =>
            getSelectedEvmFeeFromPrecomposedTransaction(
                isFinalPrecomposedTransaction(selectedFeeTransaction)
                    ? selectedFeeTransaction
                    : undefined,
            ),
        [selectedFeeTransaction],
    );
    const isWithdrawSigned =
        txReview.accountKey === flowData.account.key && !!txReview.serializedTx;
    const withdrawStatus: YieldReviewStatus =
        withdrawActionStatus === 'idle' && isWithdrawSigned ? 'signed' : withdrawActionStatus;
    const { leaveReviewFromDeviceCancel, markReviewNavigationSuccess } =
        useYieldActionReviewBackNavigation({
            onReviewLeave,
            reviewStatus: withdrawStatus,
        });

    const startWithdrawReview = useCallback(async (): Promise<YieldReviewSigningResult> => {
        if (withdrawStatus === 'signed') {
            return 'signed';
        }

        if (withdrawStatus === 'signing' || withdrawStatus === 'sending') {
            return 'already-running';
        }

        if (withdrawStatus !== 'idle') {
            return 'not-ready';
        }

        setWithdrawActionStatus('signing');

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signYieldActionReviewThunk({
                    flowData,
                    flowKey,
                    flowType: 'withdraw',
                    reviewToken,
                    selectedFee,
                }),
            ),
        );

        setWithdrawActionStatus('idle');

        if (!deviceAccessResponse.success) {
            showSignTransactionFailedAlert();

            return 'failed';
        }

        const signResponse = deviceAccessResponse.payload;
        const isSignRejected = isRejected(signResponse);

        if (isSignRejected && isUserCancelledSignError(signResponse.payload)) {
            return 'cancelled';
        }

        if (isSignRejected) {
            showSignTransactionFailedAlert();

            return 'failed';
        }

        return 'signed';
    }, [
        dispatch,
        flowData,
        flowKey,
        reviewToken,
        selectedFee,
        showSignTransactionFailedAlert,
        withdrawStatus,
    ]);

    const handleWithdrawSubmitted = useCallback(async () => {
        if (withdrawStatus !== 'signed') {
            return;
        }

        setWithdrawActionStatus('sending');

        const pushResponse = await dispatch(
            pushYieldActionReviewThunk({
                flowData,
                flowKey,
                flowType: 'withdraw',
            }),
        );

        setWithdrawActionStatus('idle');
        const isPushRejected = isRejected(pushResponse);

        if (isPushRejected) {
            if (pushResponse.payload?.error === 'push-transaction-pending-conflict') {
                showPendingTransactionConflictAlert();

                return;
            }

            showPushTransactionFailedAlert();

            return;
        }

        markReviewNavigationSuccess();
        navigation.goBack();
    }, [
        dispatch,
        flowData,
        flowKey,
        markReviewNavigationSuccess,
        navigation,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        withdrawStatus,
    ]);

    return {
        handleWithdrawSubmitted,
        leaveReviewFromDeviceCancel,
        startWithdrawReview,
        withdrawStatus,
    };
};
