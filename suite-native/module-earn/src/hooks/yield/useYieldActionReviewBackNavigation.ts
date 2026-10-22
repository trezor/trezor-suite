import { useCallback, useEffect, useRef } from 'react';

import { useNavigation } from '@react-navigation/native';

import { yieldActions } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useShowYieldReviewCancellationAlert } from './useShowYieldReviewCancellationAlert';
import { type YieldReviewStatus } from '../../types';
import { useEarnReviewCancellationAnalytics } from '../earn/useEarnReviewCancellationAnalytics';

type UseYieldActionReviewBackNavigationParams = {
    onReviewLeave?: () => void;
    reviewStatus: YieldReviewStatus;
    networkSymbol: string;
};

export const useYieldActionReviewBackNavigation = ({
    onReviewLeave,
    reviewStatus,
    networkSymbol,
}: UseYieldActionReviewBackNavigationParams) => {
    const { dispatch } = useServices(injectDispatch);
    const navigation = useNavigation();
    const showReviewCancellationAlert = useShowYieldReviewCancellationAlert();
    const isCleanupHandledRef = useRef(false);
    const reportReviewCancellation = useEarnReviewCancellationAnalytics({
        networkSymbol,
        txType: 'yield',
    });

    const discardActionReview = useCallback(
        (actionType?: string) => {
            if (reviewStatus === 'signed') reportReviewCancellation(actionType);
            dispatch(yieldActions.discardTransaction());
        },
        [dispatch, reviewStatus, reportReviewCancellation],
    );

    const cleanupCanceledActionReview = useCallback(
        (actionType?: string) => {
            if (reviewStatus === 'signing') {
                TrezorConnect.cancel({ reason: 'tx-cancelled' });
            }

            discardActionReview(actionType);
        },
        [discardActionReview, reviewStatus],
    );

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
                        cleanupCanceledActionReview(event.data.action.type);
                        isCleanupHandledRef.current = true;
                        unsubscribe();
                        navigation.dispatch(event.data.action);
                    }
                });

                return;
            }

            if (event.data.action.type === 'GO_BACK') {
                onReviewLeave?.();
                discardActionReview(event.data.action.type);

                return;
            }

            onReviewLeave?.();
            discardActionReview(event.data.action.type);
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
