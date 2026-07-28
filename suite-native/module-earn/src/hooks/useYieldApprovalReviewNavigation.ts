import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    cancelSignSendFormTransactionThunk,
    handleYieldApproveCancelThunk,
    sendFormActions,
} from '@suite-common/wallet-core';
import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';

import { type YieldAllowanceFormDraftTransactionType } from '../types';
import { useShowYieldReviewCancellationAlert } from './useShowYieldReviewCancellationAlert';

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
                    cleanupCanceledReview();
                    isCleanupHandledRef.current = true;
                    navigation.dispatch(action);
                }
            });
        },
        onPassThroughAction: () => {
            if (!isCleanupHandledRef.current) {
                onReviewLeave?.();
                cleanupReview();
            }
        },
    });

    return {
        leaveReviewFromDeviceCancel,
        markReviewNavigationSuccess,
    };
};
