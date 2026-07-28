import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { stablecoinYieldActions } from '@suite-common/wallet-core';
import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { useShowYieldReviewCancellationAlert } from './useShowYieldReviewCancellationAlert';
import { type YieldReviewStatus } from '../types';

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
        dispatch(stablecoinYieldActions.discardTransaction());
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

    const shouldConfirmCancellation =
        reviewStatus === 'signing' || reviewStatus === 'signed' || reviewStatus === 'sending';

    useNavigationRemoveActionInterceptor({
        actionTypesToIntercept: shouldConfirmCancellation ? ['GO_BACK', 'POP'] : [],
        onInterceptedAction: action => {
            if (isCleanupHandledRef.current) {
                navigation.dispatch(action);

                return;
            }

            showReviewCancellationAlert().then(({ wasReviewCanceled }) => {
                if (wasReviewCanceled) {
                    onReviewLeave?.();
                    cleanupCanceledActionReview();
                    isCleanupHandledRef.current = true;
                    navigation.dispatch(action);
                }
            });
        },
        onPassThroughAction: () => {
            if (!isCleanupHandledRef.current) {
                onReviewLeave?.();
                discardActionReview();
            }
        },
    });

    return {
        leaveReviewFromDeviceCancel,
        markReviewNavigationSuccess,
    };
};
