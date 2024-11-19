import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { Translation } from '@suite-native/intl';
import { useAlert } from '@suite-native/alerts';
import {
    AccountsRootState,
    DeviceRootState,
    selectIsDeviceRemembered,
    sendFormActions,
    SendRootState,
} from '@suite-common/wallet-core';
import {
    RootStackParamList,
    RootStackRoutes,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { TRANSPORT_ERROR } from '@trezor/transport';

import { useShowDeviceDisconnectedAlert } from './useShowDeviceDisconnectedAlert';
import { signTransactionNativeThunk } from '../sendFormThunks';
import { selectIsTransactionReviewInProgress } from '../selectors';
import { useShowReviewCancellationAlert } from './useShowReviewCancellationAlert';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>['route'];

export const useHandleOnDeviceTransactionReview = () => {
    const dispatch = useDispatch();
    const route = useRoute<RouteProps>();
    const { accountKey, tokenContract, transaction } = route.params;
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();
    const isViewOnlyDevice = useSelector(selectIsDeviceRemembered);

    const showReviewCancellationAlert = useShowReviewCancellationAlert();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedAlert();

    const isTransactionReviewInProgress = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsTransactionReviewInProgress(state, accountKey, tokenContract),
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
    });

    const handleOnDeviceTransactionReview = useCallback(async () => {
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
                navigation.navigate(SendStackRoutes.SendFees, {
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
                    pictogramVariant: 'red',
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
                    navigation.navigate(SendStackRoutes.SendFees, {
                        accountKey,
                        tokenContract,
                    });
                }
                showDeviceDisconnectedAlert();

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
