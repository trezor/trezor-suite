import { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { selectIsDeviceConnected } from '@suite-common/device';
import {
    type FormDraftRootState,
    type StablecoinYieldRootState,
    type YieldFlowDisplayToken,
    type YieldFlowResolvedData,
    type YieldWithdrawFlowType,
    isYieldTxReviewForFlow,
    selectFormDraft,
    selectStablecoinYieldTxReview,
} from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import type {
    StackNavigationProps,
    YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import {
    type YieldReviewActionStatus,
    type YieldReviewSigningResult,
    type YieldReviewStatus,
} from '../types';
import { isUserCancelledSignError } from '../utils';
import { useHandleEarnReviewError } from './useHandleEarnReviewError';
import { useShowDeviceDisconnectedDuringEarnReviewAlert } from './useShowDeviceDisconnectedDuringEarnReviewAlert';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';
import { useYieldActionReviewBackNavigation } from './useYieldActionReviewBackNavigation';
import { useYieldReviewAnalytics } from './useYieldReviewAnalytics';
import { getSelectedEvmFeeFromFormDraft } from '../utils/yieldSelectedFeeUtils';
import { getYieldWithdrawFormDraftKey } from '../utils/yieldWithdrawUtils';
import { pushYieldActionReviewThunk, signYieldActionReviewThunk } from '../yieldTransactionThunks';

type UseYieldWithdrawReviewParams = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    flowType: YieldWithdrawFlowType;
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
    flowType,
    onReviewLeave,
    reviewToken,
}: UseYieldWithdrawReviewParams): UseYieldWithdrawReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const isPushingRef = useRef(false);
    const { showReviewAlert } = useShowPushTransactionFailedDuringReviewAlert('yield-withdraw');
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();
    const handleReviewError = useHandleEarnReviewError('yield-withdraw', navigation);
    const { reportError: reportWithdrawError, reportCancel: reportWithdrawCancel } =
        useYieldReviewAnalytics({
            flow: 'withdraw',
            networkSymbol: flowData.account.symbol,
            vaultId: flowData.vault.id,
            operation: flowType,
        });
    const [withdrawActionStatus, setWithdrawActionStatus] =
        useState<YieldReviewActionStatus>('idle');
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const txReview = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldTxReview(state),
    );
    const formDraftKey = getYieldWithdrawFormDraftKey(flowKey);
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectFormDraft<FormState>(state, formDraftKey),
    );
    const selectedFee = useMemo(() => getSelectedEvmFeeFromFormDraft(formDraft), [formDraft]);
    // A leftover signed tx from a previous review of the same account must not appear
    // as signed here, hence the flow identity and `notBefore` guard.
    const [reviewOpenedAt] = useState(() => Date.now());
    const isWithdrawSigned =
        isYieldTxReviewForFlow(txReview, {
            accountKey: flowData.account.key,
            flowKey,
            flowType,
            notBefore: reviewOpenedAt,
        }) && !!txReview.serializedTx;
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

        if (!isDeviceConnected) {
            showDeviceDisconnectedAlert();

            return 'failed';
        }

        setWithdrawActionStatus('signing');

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signYieldActionReviewThunk({
                    flowData,
                    flowKey,
                    flowType,
                    reviewToken,
                    selectedFee,
                }),
            ),
        );

        setWithdrawActionStatus('idle');

        if (!deviceAccessResponse.success) {
            reportWithdrawError('submit-failed');
            handleReviewError({
                error: 'sign-transaction-failed',
                message: 'Prioritized device access failed.',
            });

            return 'failed';
        }

        const signResponse = deviceAccessResponse.payload;
        const isSignRejected = isRejected(signResponse);

        if (isSignRejected && isUserCancelledSignError(signResponse.payload)) {
            reportWithdrawCancel();

            return 'cancelled';
        }

        if (isSignRejected) {
            reportWithdrawError('submit-failed');
            handleReviewError(signResponse.payload);

            return 'failed';
        }

        return 'signed';
    }, [
        dispatch,
        flowData,
        flowKey,
        flowType,
        handleReviewError,
        isDeviceConnected,
        reportWithdrawCancel,
        reportWithdrawError,
        reviewToken,
        selectedFee,
        showDeviceDisconnectedAlert,
        withdrawStatus,
    ]);

    const handleWithdrawSubmitted = useCallback(async () => {
        // `withdrawStatus` is captured state, so two presses in the same frame both pass this
        // check. The second push finds the review data already discarded by the first and rejects
        // with "Transaction not found.", which surfaces as "not submitted" for a broadcast that
        // did go out. Broadcasting has to be idempotent per signed transaction.
        if (withdrawStatus !== 'signed' || isPushingRef.current) {
            return;
        }

        isPushingRef.current = true;
        setWithdrawActionStatus('sending');

        const pushResponse = await dispatch(
            pushYieldActionReviewThunk({
                flowData,
                flowKey,
                flowType,
            }),
        );

        // Released once the push settles, so a deliberate retry after a failure still works —
        // only concurrent invocations are blocked.
        isPushingRef.current = false;
        setWithdrawActionStatus('idle');
        const isPushRejected = isRejected(pushResponse);

        if (isPushRejected) {
            reportWithdrawError('push-failed');

            if (pushResponse.payload?.error === 'push-transaction-pending-conflict') {
                showReviewAlert('pendingConflict');

                return;
            }

            showReviewAlert('pushFailed');

            return;
        }

        markReviewNavigationSuccess();
        navigation.goBack();
    }, [
        dispatch,
        flowData,
        flowKey,
        flowType,
        markReviewNavigationSuccess,
        navigation,
        reportWithdrawError,
        showReviewAlert,
        withdrawStatus,
    ]);

    return {
        handleWithdrawSubmitted,
        leaveReviewFromDeviceCancel,
        startWithdrawReview,
        withdrawStatus,
    };
};
