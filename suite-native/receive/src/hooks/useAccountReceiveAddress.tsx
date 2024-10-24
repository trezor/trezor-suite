import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import TrezorConnect from '@trezor/connect';
import {
    AccountsRootState,
    TransactionsRootState,
    selectAccountNetworkSymbol,
    selectIsPortfolioTrackerDevice,
    confirmAddressOnDeviceThunk,
    selectIsDeviceInViewOnlyMode,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { analytics, EventType } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { useToast } from '@suite-native/toasts';
import { Translation } from '@suite-native/intl';
import { NativeAccountsRootState, selectFreshAccountAddress } from '@suite-native/accounts';

export const useAccountReceiveAddress = (accountKey: AccountKey) => {
    const dispatch = useDispatch();
    const [isReceiveApproved, setIsReceiveApproved] = useState(false);
    const [isUnverifiedAddressRevealed, setIsUnverifiedAddressRevealed] = useState(false);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const navigation = useNavigation();

    const { showToast } = useToast();

    const { showAlert } = useAlert();

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const freshAddress = useSelector((state: NativeAccountsRootState & TransactionsRootState) =>
        selectFreshAccountAddress(state, accountKey),
    );

    const handleCancel = useCallback(() => {
        TrezorConnect.cancel();
        setIsUnverifiedAddressRevealed(false);
    }, []);

    const verifyAddressOnDevice = useCallback(async (): Promise<boolean> => {
        if (accountKey && freshAddress) {
            const response = await requestPrioritizedDeviceAccess({
                deviceCallback: () =>
                    dispatch(
                        confirmAddressOnDeviceThunk({
                            accountKey,
                            addressPath: freshAddress.path,
                            chunkify: true,
                        }),
                    ).unwrap(),
            });

            if (!response.success) {
                // Wasn't able to get access to device
                console.warn(response.error);

                return false;
            }

            if (
                !response.payload.success &&
                response.payload.payload.code === 'Failure_ActionCancelled'
            ) {
                showToast({
                    icon: 'warningCircle',
                    variant: 'default',
                    message: <Translation id="moduleReceive.deviceCancelError" />,
                });
                if (navigation.canGoBack()) {
                    navigation.goBack();
                }

                return false;
            }

            if (
                !response.payload.success &&
                response.payload.payload.error === 'Passphrase is incorrect'
            ) {
                showAlert({
                    title: <Translation id="modulePassphrase.featureAuthorizationError" />,
                    pictogramVariant: 'red',
                    primaryButtonTitle: <Translation id="generic.buttons.close" />,
                    onPressPrimaryButton: handleCancel,
                    primaryButtonVariant: 'redBold',
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
                ].includes(response.payload.payload.code ?? '')
            ) {
                showAlert({
                    title: response.payload.payload.code,
                    description: response.payload.payload.error,
                    icon: 'warningCircle',
                    pictogramVariant: 'red',
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

    const handleShowAddress = useCallback(async () => {
        if (isPortfolioTrackerDevice) {
            if (networkSymbol) {
                analytics.report({
                    type: EventType.CreateReceiveAddressShowAddress,
                    payload: { assetSymbol: networkSymbol },
                });
                setIsReceiveApproved(true);
            }
        } else if (isDeviceInViewOnlyMode) {
            // If device is remembered,
            // no verification should happen and we display the receive address straight away.
            setIsUnverifiedAddressRevealed(true);
            setIsReceiveApproved(true);
        } else {
            setIsUnverifiedAddressRevealed(true);
            const wasVerificationSuccessful = await verifyAddressOnDevice();

            if (wasVerificationSuccessful) {
                analytics.report({ type: EventType.ConfirmedReceiveAdress });
                setIsReceiveApproved(true);
            } else {
                setIsUnverifiedAddressRevealed(false);
            }
        }
    }, [isDeviceInViewOnlyMode, isPortfolioTrackerDevice, networkSymbol, verifyAddressOnDevice]);

    return {
        address: freshAddress?.address,
        isReceiveApproved,
        isUnverifiedAddressRevealed,
        handleShowAddress,
    };
};
