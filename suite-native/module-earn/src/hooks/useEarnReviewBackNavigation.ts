import { useCallback, useEffect } from 'react';
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

    useEffect(() => {
        const cleanup = () => {
            dispatch(cancelSignSendFormTransactionThunk());
        };

        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (e.data.action.type === 'GO_BACK' && isTransactionReviewInProgress) {
                e.preventDefault();
                showReviewCancellationAlert().then(({ wasReviewCanceled }) => {
                    if (wasReviewCanceled) {
                        cleanup();
                        unsubscribe();
                        navigation.dispatch(e.data.action);
                    }
                });

                return;
            }

            cleanup();
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
