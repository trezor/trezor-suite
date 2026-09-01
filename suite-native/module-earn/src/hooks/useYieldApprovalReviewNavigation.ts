import { useCallback, useEffect, useRef } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import {
    cancelSignSendFormTransactionThunk,
    handleYieldApproveCancelThunk,
    sendFormActions,
} from '@suite-common/wallet-core';
import { useDisableIOSGesture } from '@suite-native/navigation';

import { useShowYieldReviewCancellationAlert } from './useShowYieldReviewCancellationAlert';
import { type YieldAllowanceFormDraftTransactionType } from '../types';

type UseYieldApprovalReviewNavigationParams = {
    flowKey: string;
    onReviewLeave?: () => void;
    shouldConfirmCancellation: boolean;
    transactionType: YieldAllowanceFormDraftTransactionType;
};

export const useYieldApprovalReviewNavigation = ({
    flowKey,
    onReviewLeave,
    shouldConfirmCancellation,
    transactionType,
}: UseYieldApprovalReviewNavigationParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const showReviewCancellationAlert = useShowYieldReviewCancellationAlert();
    const isCleanupHandledRef = useRef(false);

    useDisableIOSGesture();

    const cleanupReview = useCallback(() => {
        dispatch(sendFormActions.discardTransaction());

        if (transactionType === 'approve') {
            dispatch(handleYieldApproveCancelThunk({ flowType: 'deposit', flowKey }));
        }
    }, [dispatch, flowKey, transactionType]);

    const cleanupCanceledReview = useCallback(() => {
        dispatch(cancelSignSendFormTransactionThunk());

        if (transactionType === 'approve') {
            dispatch(handleYieldApproveCancelThunk({ flowType: 'deposit', flowKey }));
        }
    }, [dispatch, flowKey, transactionType]);

    const markReviewNavigationSuccess = useCallback(() => {
        isCleanupHandledRef.current = true;
    }, []);

    const leaveReviewFromDeviceCancel = useCallback(() => {
        onReviewLeave?.();
        cleanupCanceledReview();
        isCleanupHandledRef.current = true;
        navigation.goBack();
    }, [cleanupCanceledReview, navigation, onReviewLeave]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', event => {
            if (isCleanupHandledRef.current) {
                return;
            }

            if (event.data.action.type === 'GO_BACK' && shouldConfirmCancellation) {
                event.preventDefault();
                showReviewCancellationAlert().then(({ wasReviewCanceled }) => {
                    if (wasReviewCanceled) {
                        onReviewLeave?.();
                        cleanupCanceledReview();
                        isCleanupHandledRef.current = true;
                        unsubscribe();
                        navigation.dispatch(event.data.action);
                    }
                });

                return;
            }

            if (event.data.action.type === 'GO_BACK') {
                onReviewLeave?.();
                cleanupReview();

                return;
            }

            onReviewLeave?.();
            cleanupReview();
        });

        return unsubscribe;
    }, [
        cleanupCanceledReview,
        cleanupReview,
        navigation,
        onReviewLeave,
        shouldConfirmCancellation,
        showReviewCancellationAlert,
    ]);

    return {
        leaveReviewFromDeviceCancel,
        markReviewNavigationSuccess,
    };
};
