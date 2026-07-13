import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type TransactionsRootState, confirmAddressOnDeviceThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { type NativeAccountsRootState, selectFreshAccountAddress } from '@suite-native/accounts';
import { useAlert } from '@suite-native/alerts';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

// Note: Unused for now as we are redoing the whole receive flow as part of https://github.com/trezor/trezor-suite/issues/29732
export const useAccountReceiveAddress = (accountKey: AccountKey) => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { showToast } = useToast();

    const { showAlert } = useAlert();

    const freshAddress = useSelector((state: NativeAccountsRootState & TransactionsRootState) =>
        selectFreshAccountAddress(state, accountKey),
    );

    const handleCancel = useCallback(() => {
        TrezorConnect.cancel();
    }, []);

    const verifyAddressOnDevice = useCallback(async (): Promise<boolean> => {
        if (accountKey && freshAddress) {
            const response = await requestPrioritizedDeviceAccess(() =>
                dispatch(
                    confirmAddressOnDeviceThunk({
                        accountKey,
                        addressPath: freshAddress.path,
                        chunkify: true,
                    }),
                ).unwrap(),
            );

            if (!response.success) {
                // Wasn't able to get access to device
                console.warn(response.error);

                return false;
            }

            if (
                !response.payload.success &&
                response.payload.error.code === 'Failure_ActionCancelled'
            ) {
                showToast({
                    icon: 'warningCircle',
                    intent: 'neutral',
                    message: <Translation id="moduleReceive.deviceCancelError" />,
                });
                if (navigation.canGoBack()) {
                    navigation.goBack();
                }

                return false;
            }

            if (
                !response.payload.success &&
                response.payload.error.message === 'Passphrase is incorrect'
            ) {
                showAlert({
                    title: <Translation id="modulePassphrase.featureAuthorizationError" />,
                    pictogramVariant: 'critical',
                    primaryButtonTitle: <Translation id="generic.buttons.close" />,
                    onPressPrimaryButton: handleCancel,
                    primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                });

                return false;
            }

            if (
                !response.payload.success &&
                // Do not show alert for user cancelled actions
                ![
                    'Method_Interrupted',
                    'Failure_PinInvalid',
                    'Method_Cancel',
                    'Failure_PinCancelled',
                ].includes(response.payload.error.code ?? '')
            ) {
                showAlert({
                    title: response.payload.error.code,
                    description: response.payload.error.message,
                    pictogramVariant: 'critical',
                    primaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                    onPressPrimaryButton: () => {
                        handleCancel();
                        navigation.goBack();
                    },
                });

                return false;
            }

            return response.payload.success;
        }

        return false;
    }, [accountKey, dispatch, freshAddress, handleCancel, navigation, showAlert, showToast]);

    return {
        address: freshAddress?.address,
        verifyAddressOnDevice,
    };
};
