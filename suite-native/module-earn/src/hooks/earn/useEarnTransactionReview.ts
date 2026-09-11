import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceConnected } from '@suite-common/device';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';

import { useHandleEarnReviewError } from './useHandleEarnReviewError';
import { useShowDeviceDisconnectedDuringEarnReviewAlert } from './useShowDeviceDisconnectedDuringEarnReviewAlert';
import {
    type ReviewFormType,
    useShowPushTransactionFailedDuringReviewAlert,
} from './useShowPushTransactionFailedDuringReviewAlert';
import {
    type YieldReviewActionStatus,
    type YieldReviewSigningResult,
    type YieldReviewStatus,
} from '../../types';
import { type EarnReviewErrorPayload, isUserCancelledSignError } from '../../utils/earn/utils';
import { useYieldActionReviewBackNavigation } from '../yield/useYieldActionReviewBackNavigation';

/** Structural shape of a dispatched thunk result, discriminated by `meta.requestStatus`. */
type FulfilledThunkResult<TFulfilled> = {
    meta: { requestStatus: 'fulfilled' };
    payload: TFulfilled;
};
type RejectedThunkResult<TRejected> = {
    meta: { requestStatus: 'rejected' };
    payload: TRejected | undefined;
};
type EarnReviewThunkResult<TFulfilled, TRejected> = Promise<
    FulfilledThunkResult<TFulfilled> | RejectedThunkResult<TRejected>
>;

// TypeScript does not narrow unions through the nested `meta.requestStatus` discriminant,
// hence the explicit type guard.
const isRejectedThunkResult = <TFulfilled, TRejected>(
    result: FulfilledThunkResult<TFulfilled> | RejectedThunkResult<TRejected>,
): result is RejectedThunkResult<TRejected> => result.meta.requestStatus === 'rejected';

export type EarnReviewPushErrorPayload = {
    error: 'push-transaction-failed' | 'push-transaction-pending-conflict';
    message?: string;
};

type UseEarnTransactionReviewParams<TSigned, TPushed> = {
    formType: ReviewFormType;
    /** External signal that a signed transaction is ready to push (session or local state). */
    isSigned: boolean;
    navigation: { pop: () => void };
    onPushSuccess: (payload: TPushed) => void;
    onReviewLeave?: () => void;
    onSignSuccess?: (payload: TSigned) => void;
    reportCancel?: () => void;
    reportError?: (error: 'submit-failed' | 'push-failed') => void;
    /** Dispatches the sign thunk; the hook runs it under prioritized device access. */
    signAction: () => EarnReviewThunkResult<TSigned, EarnReviewErrorPayload>;
    /** Dispatches the push thunk; `null` when the signed payload is unexpectedly missing. */
    pushAction: () => EarnReviewThunkResult<TPushed, EarnReviewPushErrorPayload> | null;
};

/**
 * Sign & push state machine shared by the earn review flows (deposit, standalone wrap, …):
 * device-connected guard, prioritized device access, user-cancel detection, error alerts, and
 * the pending-conflict handling on push. The flow-specific thunks, signed-state source, and
 * post-push navigation are injected.
 */
export const useEarnTransactionReview = <TSigned, TPushed>({
    formType,
    isSigned,
    navigation,
    onPushSuccess,
    onReviewLeave,
    onSignSuccess,
    reportCancel,
    reportError,
    signAction,
    pushAction,
}: UseEarnTransactionReviewParams<TSigned, TPushed>) => {
    const { showReviewAlert } = useShowPushTransactionFailedDuringReviewAlert(formType);
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();
    const handleReviewError = useHandleEarnReviewError(formType, navigation);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const [actionStatus, setActionStatus] = useState<YieldReviewActionStatus>('idle');
    const isPushingRef = useRef(false);

    const status: YieldReviewStatus = actionStatus === 'idle' && isSigned ? 'signed' : actionStatus;

    const { leaveReviewFromDeviceCancel, markReviewNavigationSuccess } =
        useYieldActionReviewBackNavigation({
            onReviewLeave,
            reviewStatus: status,
        });

    const startReview = useCallback(async (): Promise<YieldReviewSigningResult> => {
        if (status === 'signed') {
            return 'signed';
        }

        if (status === 'signing' || status === 'sending') {
            return 'already-running';
        }

        if (status !== 'idle') {
            return 'not-ready';
        }

        if (!isDeviceConnected) {
            showDeviceDisconnectedAlert();

            return 'failed';
        }

        setActionStatus('signing');

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() => signAction());

        setActionStatus('idle');

        if (!deviceAccessResponse.success) {
            reportError?.('submit-failed');
            handleReviewError({
                error: 'sign-transaction-failed',
                message: 'Prioritized device access failed.',
            });

            return 'failed';
        }

        const signResponse = deviceAccessResponse.payload;

        if (isRejectedThunkResult(signResponse)) {
            if (isUserCancelledSignError(signResponse.payload)) {
                reportCancel?.();

                return 'cancelled';
            }

            reportError?.('submit-failed');
            handleReviewError(signResponse.payload);

            return 'failed';
        }

        onSignSuccess?.(signResponse.payload);

        return 'signed';
    }, [
        handleReviewError,
        isDeviceConnected,
        onSignSuccess,
        reportCancel,
        reportError,
        showDeviceDisconnectedAlert,
        signAction,
        status,
    ]);

    const submitReview = useCallback(async (): Promise<TPushed | undefined> => {
        if (status !== 'signed' || isPushingRef.current) {
            return undefined;
        }

        isPushingRef.current = true;

        try {
            const pushPromise = pushAction();

            if (!pushPromise) {
                return undefined;
            }

            setActionStatus('sending');

            const pushResponse = await pushPromise;

            if (isRejectedThunkResult(pushResponse)) {
                setActionStatus('idle');
                reportError?.('push-failed');
                showReviewAlert(
                    pushResponse.payload?.error === 'push-transaction-pending-conflict'
                        ? 'pendingConflict'
                        : 'pushFailed',
                );

                return undefined;
            }

            // Stay in 'sending' on success: push thunks discard the signed
            // transaction before resolving, so resetting to idle here would drop
            // the signed status (and unmount the submit UI) before finalization
            // navigates away.
            return pushResponse.payload;
        } finally {
            isPushingRef.current = false;
        }
    }, [pushAction, reportError, showReviewAlert, status]);

    const finalizeSubmit = useCallback(
        (payload: TPushed) => {
            markReviewNavigationSuccess();
            onPushSuccess(payload);
        },
        [markReviewNavigationSuccess, onPushSuccess],
    );

    const handleSubmitted = useCallback(async () => {
        const pushedPayload = await submitReview();

        if (pushedPayload !== undefined) {
            finalizeSubmit(pushedPayload);
        }
    }, [finalizeSubmit, submitReview]);

    return {
        finalizeSubmit,
        handleSubmitted,
        leaveReviewFromDeviceCancel,
        startReview,
        status,
        submitReview,
    };
};
