import { useCallback, useEffect, useRef } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import { yieldActions } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { useShowYieldReviewCancellationAlert } from './useShowYieldReviewCancellationAlert';
import { type YieldReviewStatus } from '../../types';

type UseYieldActionReviewBackNavigationParams = {
    onReviewLeave?: () => void;
    reviewStatus: YieldReviewStatus;
};

export const useYieldActionReviewBackNavigation = ({
    onReviewLeave,
    reviewStatus,
}: UseYieldActionReviewBackNavigationParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const showReviewCancellationAlert = useShowYieldReviewCancellationAlert();
    const isCleanupHandledRef = useRef(false);

    const discardActionReview = useCallback(() => {
        dispatch(yieldActions.discardTransaction());
    }, [dispatch]);

    const cleanupCanceledActionReview = useCallback(() => {
        if (reviewStatus === 'signing') {
            TrezorConnect.cancel({ reason: 'tx-cancelled' });
        }

        discardActionReview();
    }, [discardActionReview, reviewStatus]);

    const markReviewNavigationSuccess = useCallback(() => {
        isCleanupHandledRef.current = true;
    }, []);

    const leaveReviewFromDeviceCancel = useCallback(() => {
        onReviewLeave?.();
        cleanupCanceledActionReview();
        isCleanupHandledRef.current = true;
        navigation.goBack();
    }, [cleanupCanceledActionReview, navigation, onReviewLeave]);

    useEffect(() => {
        const shouldConfirmCancellation =
            reviewStatus === 'signing' || reviewStatus === 'signed' || reviewStatus === 'sending';

        const unsubscribe = navigation.addListener('beforeRemove', event => {
            if (isCleanupHandledRef.current) {
                return;
            }

            if (event.data.action.type === 'GO_BACK' && shouldConfirmCancellation) {
                event.preventDefault();
                showReviewCancellationAlert().then(({ wasReviewCanceled }) => {
                    if (wasReviewCanceled) {
                        onReviewLeave?.();
                        cleanupCanceledActionReview();
                        isCleanupHandledRef.current = true;
                        unsubscribe();
                        navigation.dispatch(event.data.action);
                    }
                });

                return;
            }

            if (event.data.action.type === 'GO_BACK') {
                onReviewLeave?.();
                discardActionReview();

                return;
            }

            onReviewLeave?.();
            discardActionReview();
        });

        return unsubscribe;
    }, [
        cleanupCanceledActionReview,
        discardActionReview,
        navigation,
        onReviewLeave,
        reviewStatus,
        showReviewCancellationAlert,
    ]);

    return {
        leaveReviewFromDeviceCancel,
        markReviewNavigationSuccess,
    };
};
