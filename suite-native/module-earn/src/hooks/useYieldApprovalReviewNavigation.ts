import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    cancelSignSendFormTransactionThunk,
    handleYieldApproveCancelThunk,
    sendFormActions,
} from '@suite-common/wallet-core';
import { useDisableIOSGesture } from '@suite-native/navigation';
import { useShowReviewCancellationAlert } from '@suite-native/transaction-management';

type UseYieldApprovalReviewNavigationParams = {
    flowKey: string;
    shouldConfirmCancellation: boolean;
};

export const useYieldApprovalReviewNavigation = ({
    flowKey,
    shouldConfirmCancellation,
}: UseYieldApprovalReviewNavigationParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const showReviewCancellationAlert = useShowReviewCancellationAlert();

    useDisableIOSGesture();

    const cleanupApprovalReview = useCallback(() => {
        dispatch(cancelSignSendFormTransactionThunk());
        dispatch(handleYieldApproveCancelThunk({ flowType: 'supply', flowKey }));
    }, [dispatch, flowKey]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', event => {
            if (event.data.action.type === 'GO_BACK' && shouldConfirmCancellation) {
                event.preventDefault();
                showReviewCancellationAlert().then(({ wasReviewCanceled }) => {
                    if (wasReviewCanceled) {
                        cleanupApprovalReview();
                        unsubscribe();
                        navigation.dispatch(event.data.action);
                    }
                });

                return;
            }

            if (event.data.action.type === 'GO_BACK') {
                dispatch(sendFormActions.discardTransaction());

                return;
            }

            cleanupApprovalReview();
        });

        return unsubscribe;
    }, [
        cleanupApprovalReview,
        dispatch,
        navigation,
        shouldConfirmCancellation,
        showReviewCancellationAlert,
    ]);
};
