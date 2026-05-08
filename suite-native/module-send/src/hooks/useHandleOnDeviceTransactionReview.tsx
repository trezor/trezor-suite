import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { sendFormActions } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type GeneralPrecomposedTransactionFinal,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type SendStackParamList,
    type SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { signTransactionNativeThunk } from '@suite-native/send';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    useShowReviewCancellationAlert,
} from '@suite-native/transaction-management';

import { useHandleCommonSignRejection } from './useHandleCommonSignRejection';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

type HandleOnDeviceTransactionReviewProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    transaction: GeneralPrecomposedTransactionFinal | null;
};

export const useHandleOnDeviceTransactionReview = ({
    accountKey,
    tokenContract,
    transaction,
}: HandleOnDeviceTransactionReviewProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();

    const showReviewCancellationAlert = useShowReviewCancellationAlert();
    const handleCommonSignRejection = useHandleCommonSignRejection({ accountKey, tokenContract });

    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'send', accountKey, tokenContract),
    );

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            // Ask user to confirm if they want to leave the screen and cancel the review.
            if (e.data.action.type === 'GO_BACK' && isTransactionReviewInProgress) {
                e.preventDefault();
                showReviewCancellationAlert();

                return;
            }

            // Delete canceled transaction review state leftovers.
            dispatch(sendFormActions.discardTransaction());
        });

        return unsubscribe;
    }, [navigation, isTransactionReviewInProgress, showReviewCancellationAlert, dispatch]);

    const handleOnDeviceTransactionReview = useCallback(async () => {
        if (!transaction) {
            return;
        }

        const response = await dispatch(
            signTransactionNativeThunk({
                accountKey,
                tokenContract,
                feeLevel: transaction,
            }),
        );

        if (isRejected(response)) {
            if (response.payload?.error === 'sign-transaction-timeout') {
                return;
            }

            if (handleCommonSignRejection(response.payload)) {
                return;
            }

            const errorCode = response.payload?.errorCode;

            if (
                errorCode === 'Device_InvalidState' || // Incorrect Passphrase submitted.
                errorCode === 'Method_Interrupted' // Passphrase modal closed.
            ) {
                showAlert({
                    title: <Translation id="modulePassphrase.featureAuthorizationError" />,
                    pictogramVariant: 'critical',
                    primaryButtonTitle: <Translation id="generic.buttons.close" />,
                    primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                });

                return;
            }

            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey,
                tokenContract,
                closeActionType: 'back',
            });
        }
    }, [
        accountKey,
        tokenContract,
        transaction,
        navigation,
        handleCommonSignRejection,
        dispatch,
        showAlert,
    ]);

    return handleOnDeviceTransactionReview;
};
