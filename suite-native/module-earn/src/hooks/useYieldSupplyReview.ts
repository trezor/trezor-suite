import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import {
    type StablecoinYieldRootState,
    type YieldFlowResolvedData,
    selectStablecoinYieldTxReview,
} from '@suite-common/wallet-core';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import type {
    StackNavigationProps,
    YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { USER_CANCELLED_ERROR_CODES } from '../constants';
import { pushYieldActionReviewThunk, signYieldActionReviewThunk } from '../yieldTransactionThunks';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';

type UseYieldSupplyReviewParams = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
};

type YieldSupplyReviewActionStatus = 'idle' | 'signing' | 'sending';
type YieldSupplyReviewStatus = YieldSupplyReviewActionStatus | 'signed';

type UseYieldSupplyReviewResult = {
    supplyStatus: YieldSupplyReviewStatus;
    handleSubmitSupplyReview: () => Promise<void>;
    handleSupplySubmitted: () => Promise<void>;
};

type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldSupplyReview
>;

const isUserCancelledSignError = (payload: { errorCode?: string; message?: string } | undefined) =>
    payload?.message === 'tx-cancelled' ||
    (!!payload?.errorCode && USER_CANCELLED_ERROR_CODES.some(code => code === payload.errorCode));

export const useYieldSupplyReview = ({
    flowData,
    flowKey,
}: UseYieldSupplyReviewParams): UseYieldSupplyReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const {
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        showSignTransactionFailedAlert,
    } = useShowPushTransactionFailedDuringReviewAlert('yield-supply');
    const [supplyActionStatus, setSupplyActionStatus] =
        useState<YieldSupplyReviewActionStatus>('idle');
    const txReview = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldTxReview(state),
    );
    const isSupplySigned = txReview.accountKey === flowData.account.key && !!txReview.serializedTx;
    const supplyStatus: YieldSupplyReviewStatus =
        supplyActionStatus === 'idle' && isSupplySigned ? 'signed' : supplyActionStatus;

    const handleSubmitSupplyReview = useCallback(async () => {
        if (supplyStatus !== 'idle') {
            return;
        }

        setSupplyActionStatus('signing');

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signYieldActionReviewThunk({
                    flowData,
                    flowKey,
                    flowType: 'deposit',
                }),
            ),
        );

        setSupplyActionStatus('idle');

        if (!deviceAccessResponse.success) {
            showSignTransactionFailedAlert();

            return;
        }

        const signResponse = deviceAccessResponse.payload;
        const isSignRejected = isRejected(signResponse);

        if (isSignRejected && !isUserCancelledSignError(signResponse.payload)) {
            showSignTransactionFailedAlert();
        }
    }, [dispatch, flowData, flowKey, showSignTransactionFailedAlert, supplyStatus]);

    const handleSupplySubmitted = useCallback(async () => {
        if (supplyStatus !== 'signed') {
            return;
        }

        setSupplyActionStatus('sending');

        const pushResponse = await dispatch(
            pushYieldActionReviewThunk({
                flowData,
                flowKey,
                flowType: 'deposit',
            }),
        );

        setSupplyActionStatus('idle');
        const isPushRejected = isRejected(pushResponse);

        if (isPushRejected) {
            if (pushResponse.payload?.error === 'push-transaction-pending-conflict') {
                showPendingTransactionConflictAlert();

                return;
            }

            showPushTransactionFailedAlert();

            return;
        }

        navigation.goBack();
    }, [
        dispatch,
        flowData,
        flowKey,
        navigation,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        supplyStatus,
    ]);

    return {
        supplyStatus,
        handleSubmitSupplyReview,
        handleSupplySubmitted,
    };
};
