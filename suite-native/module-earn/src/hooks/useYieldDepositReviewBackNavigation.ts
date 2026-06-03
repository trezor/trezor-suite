import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { stablecoinYieldActions } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { useShowYieldReviewCancellationAlert } from './useShowYieldReviewCancellationAlert';
import { type YieldDepositReviewStatus } from '../types';

type UseYieldDepositReviewBackNavigationParams = {
    depositStatus: YieldDepositReviewStatus;
    onReviewLeave?: () => void;
};

export const useYieldDepositReviewBackNavigation = ({
    depositStatus,
    onReviewLeave,
}: UseYieldDepositReviewBackNavigationParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const showReviewCancellationAlert = useShowYieldReviewCancellationAlert();
    const isCleanupHandledRef = useRef(false);

    const discardDepositReview = useCallback(() => {
        dispatch(stablecoinYieldActions.discardTransaction());
    }, [dispatch]);

    const cleanupCanceledDepositReview = useCallback(() => {
        if (depositStatus === 'signing') {
            TrezorConnect.cancel({ reason: 'tx-cancelled' });
        }

        discardDepositReview();
    }, [depositStatus, discardDepositReview]);

    const markReviewNavigationSuccess = useCallback(() => {
        isCleanupHandledRef.current = true;
    }, []);

    const leaveReviewFromDeviceCancel = useCallback(() => {
        onReviewLeave?.();
        cleanupCanceledDepositReview();
        isCleanupHandledRef.current = true;
        navigation.goBack();
    }, [cleanupCanceledDepositReview, navigation, onReviewLeave]);

    useEffect(() => {
        const shouldConfirmCancellation =
            depositStatus === 'signing' ||
            depositStatus === 'signed' ||
            depositStatus === 'sending';

        const unsubscribe = navigation.addListener('beforeRemove', event => {
            if (isCleanupHandledRef.current) {
                return;
            }

            if (event.data.action.type === 'GO_BACK' && shouldConfirmCancellation) {
                event.preventDefault();
                showReviewCancellationAlert().then(({ wasReviewCanceled }) => {
                    if (wasReviewCanceled) {
                        onReviewLeave?.();
                        cleanupCanceledDepositReview();
                        isCleanupHandledRef.current = true;
                        unsubscribe();
                        navigation.dispatch(event.data.action);
                    }
                });

                return;
            }

            if (event.data.action.type === 'GO_BACK') {
                onReviewLeave?.();
                discardDepositReview();

                return;
            }

            onReviewLeave?.();
            discardDepositReview();
        });

        return unsubscribe;
    }, [
        cleanupCanceledDepositReview,
        depositStatus,
        discardDepositReview,
        navigation,
        onReviewLeave,
        showReviewCancellationAlert,
    ]);

    return {
        leaveReviewFromDeviceCancel,
        markReviewNavigationSuccess,
    };
};
