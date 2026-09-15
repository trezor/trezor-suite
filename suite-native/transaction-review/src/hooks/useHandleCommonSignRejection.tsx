import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceRemembered } from '@suite-common/device';
import {
    type SignTransactionError,
    type SignTransactionTimeoutError,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    type SendStackParamList,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { TRANSPORT_ERROR } from '@trezor/transport-common';

import { useShowDeviceDisconnectedAlert } from './useShowDeviceDisconnectedAlert';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

type UseHandleCommonSignRejectionArgs = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type SignRejectionPayload = SignTransactionError | SignTransactionTimeoutError | undefined;

// Handles user-cancel and device-disconnected branches shared between
// the initial sign flow and the Solana validity-timer retry flow.
export const useHandleCommonSignRejection = ({
    accountKey,
    tokenContract,
}: UseHandleCommonSignRejectionArgs) => {
    const navigation = useNavigation<NavigationProps>();
    const isViewOnlyDevice = useSelector(selectIsDeviceRemembered);
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedAlert();

    return useCallback(
        (payload: SignRejectionPayload): boolean => {
            const errorCode = payload?.errorCode;
            const message = payload?.message;

            if (
                errorCode === 'Failure_PinCancelled' ||
                errorCode === 'Method_Cancel' ||
                errorCode === 'Failure_ActionCancelled'
            ) {
                navigation.popTo(SendStackRoutes.SendOutputs, { accountKey, tokenContract });

                return true;
            }

            if (
                message === TRANSPORT_ERROR.DEVICE_DISCONNECTED_DURING_ACTION ||
                message === TRANSPORT_ERROR.UNEXPECTED_ERROR
            ) {
                if (isViewOnlyDevice) {
                    navigation.popTo(SendStackRoutes.SendOutputs, {
                        accountKey,
                        tokenContract,
                        postNavigationAction: 'deviceDisconnectedAlert',
                    });
                } else {
                    showDeviceDisconnectedAlert();
                }

                return true;
            }

            return false;
        },
        [accountKey, tokenContract, navigation, isViewOnlyDevice, showDeviceDisconnectedAlert],
    );
};
