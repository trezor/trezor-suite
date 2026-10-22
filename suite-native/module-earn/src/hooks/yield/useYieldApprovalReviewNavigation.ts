import { useCallback, useEffect, useRef } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    cancelSignSendFormTransactionThunk,
    handleYieldApproveCancelThunk,
    sendFormActions,
} from '@suite-common/wallet-core';
import { useDisableIOSGesture } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useShowYieldReviewCancellationAlert } from './useShowYieldReviewCancellationAlert';
import { type YieldAllowanceFormDraftTransactionType } from '../../types';
import { useEarnReviewCancellationAnalytics } from '../earn/useEarnReviewCancellationAnalytics';

type UseYieldApprovalReviewNavigationParams = {
    flowKey: string;
    onReviewLeave?: () => void;
    shouldConfirmCancellation: boolean;
    transactionType: YieldAllowanceFormDraftTransactionType;
    networkSymbol: string;
    isSigned: boolean;
};

export const useYieldApprovalReviewNavigation = ({
    flowKey,
    onReviewLeave,
    shouldConfirmCancellation,
    transactionType,
    networkSymbol,
    isSigned,
}: UseYieldApprovalReviewNavigationParams) => {
    const { dispatch } = useServices(injectDispatch);
    const navigation = useNavigation();
    const showReviewCancellationAlert = useShowYieldReviewCancellationAlert();
    const isCleanupHandledRef = useRef(false);
    const isReviewCancelledByUserRef = useRef(false);
    const reportReviewCancellation = useEarnReviewCancellationAnalytics({
        networkSymbol,
        txType: 'yield',
    });

    useDisableIOSGesture();

    const cleanupReview = useCallback(
        (actionType?: string) => {
            if (isSigned) reportReviewCancellation(actionType);
            dispatch(sendFormActions.discardTransaction());

            if (transactionType === 'approve') {
                dispatch(handleYieldApproveCancelThunk({ flowType: 'deposit', flowKey }));
            }
        },
        [dispatch, flowKey, transactionType, isSigned, reportReviewCancellation],
    );

    const cleanupCanceledReview = useCallback(
        (actionType?: string) => {
            if (isSigned) reportReviewCancellation(actionType);
            dispatch(cancelSignSendFormTransactionThunk());

            if (transactionType === 'approve') {
                dispatch(handleYieldApproveCancelThunk({ flowType: 'deposit', flowKey }));
            }
        },
        [dispatch, flowKey, transactionType, isSigned, reportReviewCancellation],
    );

    const markReviewNavigationSuccess = useCallback(() => {
        isCleanupHandledRef.current = true;
    }, []);

    const leaveReviewFromDeviceCancel = useCallback(() => {
        onReviewLeave?.();
        isReviewCancelledByUserRef.current = true;
        cleanupCanceledReview();
        isCleanupHandledRef.current = true;
        navigation.goBack();
    }, [cleanupCanceledReview, navigation, onReviewLeave]);

    const wasReviewCancelledByUser = useCallback(() => isReviewCancelledByUserRef.current, []);

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
                        isReviewCancelledByUserRef.current = true;
                        cleanupCanceledReview(event.data.action.type);
                        isCleanupHandledRef.current = true;
                        unsubscribe();
                        navigation.dispatch(event.data.action);
                    }
                });

                return;
            }

            if (event.data.action.type === 'GO_BACK') {
                onReviewLeave?.();
                cleanupReview(event.data.action.type);

                return;
            }

            onReviewLeave?.();
            cleanupReview(event.data.action.type);
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
        wasReviewCancelledByUser,
    };
};
