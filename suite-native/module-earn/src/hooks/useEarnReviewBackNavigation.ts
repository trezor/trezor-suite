import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { formDraftActions, sendFormActions } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { useOverrideBackNavigation } from '@suite-native/navigation';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    useShowReviewCancellationAlert,
} from '@suite-native/transaction-management';

type EarnReviewFormType = 'stake' | 'claim';

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

    const onNavigateBack = useCallback(async () => {
        if (isTransactionReviewInProgress) {
            const { wasReviewCanceled } = await showReviewCancellationAlert();
            if (!wasReviewCanceled) return;
        }
        dispatch(sendFormActions.discardTransaction());
        dispatch(formDraftActions.removeDraft({ key: getFormDraftKey(formType, '') }));
        navigation.goBack();
    }, [
        isTransactionReviewInProgress,
        showReviewCancellationAlert,
        dispatch,
        navigation,
        formType,
    ]);

    useOverrideBackNavigation({ onNavigateBack });
};
