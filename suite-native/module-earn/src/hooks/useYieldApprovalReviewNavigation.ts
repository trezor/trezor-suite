import { useCallback, useEffect } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type StablecoinYieldRootState,
    cancelSignSendFormTransactionThunk,
    handleYieldApproveCancelThunk,
    selectStablecoinYieldSession,
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
    const store = useStore<StablecoinYieldRootState>();
    const navigation = useNavigation();
    const showReviewCancellationAlert = useShowReviewCancellationAlert();

    useDisableIOSGesture();

    const cleanupApprovalReview = useCallback(() => {
        dispatch(cancelSignSendFormTransactionThunk());
        dispatch(handleYieldApproveCancelThunk({ flowType: 'supply', flowKey }));
    }, [dispatch, flowKey]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', event => {
            const isBackNavigation = event.data.action.type === 'GO_BACK';
            const { approval } = selectStablecoinYieldSession(store.getState(), 'supply', flowKey);

            if (approval.isPending) {
                return;
            }

            if (isBackNavigation && shouldConfirmCancellation) {
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

            if (isBackNavigation) {
                dispatch(sendFormActions.discardTransaction());

                return;
            }

            cleanupApprovalReview();
        });

        return unsubscribe;
    }, [
        cleanupApprovalReview,
        dispatch,
        flowKey,
        navigation,
        shouldConfirmCancellation,
        showReviewCancellationAlert,
        store,
    ]);
};
