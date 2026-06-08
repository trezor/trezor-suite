import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { cancelSignSendFormTransactionThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    useShowReviewCancellationAlert,
} from '@suite-native/transaction-management';

import { type EarnFormDraftPrefix } from '../types';

const REVIEW_EXIT_ACTION_TYPES = ['GO_BACK', 'POP_TO_TOP'];

export const useEarnReviewBackNavigation = (
    formType: EarnFormDraftPrefix,
    accountKey: AccountKey,
) => {
    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, formType, accountKey),
    );

    const dispatch = useDispatch();
    const navigation = useNavigation();
    const showReviewCancellationAlert = useShowReviewCancellationAlert();

    const isCancellationAlertVisibleRef = useRef(false);

    useEffect(() => {
        const cleanup = () => {
            dispatch(cancelSignSendFormTransactionThunk());
        };

        const unsubscribe = navigation.addListener('beforeRemove', e => {
            const isLeavingReview = REVIEW_EXIT_ACTION_TYPES.includes(e.data.action.type);

            if (!isLeavingReview || !isTransactionReviewInProgress) {
                cleanup();

                return;
            }

            e.preventDefault();

            if (isCancellationAlertVisibleRef.current) {
                return;
            }
            isCancellationAlertVisibleRef.current = true;

            showReviewCancellationAlert().then(({ wasReviewCanceled }) => {
                isCancellationAlertVisibleRef.current = false;

                if (wasReviewCanceled) {
                    cleanup();
                    unsubscribe();
                    navigation.dispatch(e.data.action);
                }
            });
        });

        return unsubscribe;
    }, [
        accountKey,
        navigation,
        isTransactionReviewInProgress,
        showReviewCancellationAlert,
        dispatch,
        formType,
    ]);

    const navigateBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return { navigateBack };
};
