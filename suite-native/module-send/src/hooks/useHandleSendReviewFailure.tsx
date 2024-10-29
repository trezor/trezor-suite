import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { PayloadAction } from '@reduxjs/toolkit';

import { Translation } from '@suite-native/intl';
import { useAlert } from '@suite-native/alerts';
import { selectIsDeviceRemembered, SignTransactionError } from '@suite-common/wallet-core';
import {
    RootStackParamList,
    RootStackRoutes,
    SendStackParamList,
    SendStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { GeneralPrecomposedTransactionFinal, TokenAddress } from '@suite-common/wallet-types';
import { TRANSPORT_ERROR } from '@trezor/transport';

import { useShowDeviceDisconnectedAlert } from './useShowDeviceDisconnectedAlert';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

type UseHandleSendReviewFailureArguments = {
    accountKey: string;
    transaction: GeneralPrecomposedTransactionFinal;
    tokenContract?: TokenAddress;
};

export const useHandleSendReviewFailure = ({
    accountKey,
    tokenContract,
    transaction,
}: UseHandleSendReviewFailureArguments) => {
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();
    const isViewOnlyDevice = useSelector(selectIsDeviceRemembered);
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedAlert();

    const handleSendReviewFailure = (response: PayloadAction<SignTransactionError | undefined>) => {
        const errorCode = response.payload?.errorCode;
        const message = response.payload?.message;

        if (
            errorCode === 'Failure_PinCancelled' || // User cancelled the pin entry on device
            errorCode === 'Method_Cancel' || // User canceled the pin entry in the app UI.
            errorCode === 'Failure_ActionCancelled' // User canceled the review on device OR device got locked before the review was finished.
        ) {
            navigation.navigate(SendStackRoutes.SendAddressReview, {
                accountKey,
                tokenContract,
                transaction,
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
                navigation.navigate(SendStackRoutes.SendAddressReview, {
                    accountKey,
                    tokenContract,
                    transaction,
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
    };

    return handleSendReviewFailure;
};
