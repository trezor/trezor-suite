import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { selectIsDeviceRemembered } from '@suite-common/device';
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
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { signTransactionNativeThunk } from '@suite-native/send';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    useShowReviewCancellationAlert,
} from '@suite-native/transaction-management';
import { TRANSPORT_ERROR } from '@trezor/transport';

import { useShowDeviceDisconnectedAlert } from './useShowDeviceDisconnectedAlert';

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
    const isViewOnlyDevice = useSelector(selectIsDeviceRemembered);

    const showReviewCancellationAlert = useShowReviewCancellationAlert();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedAlert();

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
            const errorCode = response.payload?.errorCode;
            const message = response.payload?.message;

            if (
                errorCode === 'Failure_PinCancelled' || // User cancelled the pin entry on device
                errorCode === 'Method_Cancel' || // User canceled the pin entry in the app UI.
                errorCode === 'Failure_ActionCancelled' // User canceled the review on device OR device got locked before the review was finished.
            ) {
                navigation.popTo(SendStackRoutes.SendFees, {
                    accountKey,
                    tokenContract,
                });

                return;
            }

            if (
                errorCode === 'Device_InvalidState' || // Incorrect Passphrase submitted.
                errorCode === 'Method_Interrupted' // Passphrase modal closed.
            ) {
                showAlert({
                    title: <Translation id="modulePassphrase.featureAuthorizationError" />,
                    pictogramVariant: 'critical',
                    primaryButtonTitle: <Translation id="generic.buttons.close" />,
                    primaryButtonVariant: 'redBold',
                });

                return;
            }

            // Device disconnected during the review.
            if (
                message === TRANSPORT_ERROR.DEVICE_DISCONNECTED_DURING_ACTION ||
                message === TRANSPORT_ERROR.UNEXPECTED_ERROR
            ) {
                if (isViewOnlyDevice) {
                    navigation.popTo(SendStackRoutes.SendFees, {
                        accountKey,
                        tokenContract,
                    });
                }

                // Timeout needed so the navigation back to home screen of not remembered device is not interrupted by the alert.
                setTimeout(() => {
                    showDeviceDisconnectedAlert();
                }, 1500);

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
        isViewOnlyDevice,
        navigation,
        showDeviceDisconnectedAlert,
        dispatch,
        showAlert,
    ]);

    return handleOnDeviceTransactionReview;
};
