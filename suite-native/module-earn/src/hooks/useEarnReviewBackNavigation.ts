import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { formDraftActions, sendFormActions } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    useShowReviewCancellationAlert,
} from '@suite-native/transaction-management';

type EarnReviewFormType = 'stake' | 'unstake' | 'claim';

export const useEarnReviewBackNavigation = (
    formType: EarnReviewFormType,
    accountKey: AccountKey,
) => {
    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, formType, accountKey),
    );

    const dispatch = useDispatch();
    const navigation = useNavigation();
    const showReviewCancellationAlert = useShowReviewCancellationAlert();

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (e.data.action.type === 'GO_BACK' && isTransactionReviewInProgress) {
                e.preventDefault();
                showReviewCancellationAlert().then(({ wasReviewCanceled }) => {
                    if (wasReviewCanceled) navigation.dispatch(e.data.action);
                });

                return;
            }

            dispatch(sendFormActions.discardTransaction());
            dispatch(formDraftActions.removeDraft({ key: getFormDraftKey(formType, '') }));
        });

        return unsubscribe;
    }, [
        navigation,
        isTransactionReviewInProgress,
        showReviewCancellationAlert,
        dispatch,
        formType,
    ]);
};
