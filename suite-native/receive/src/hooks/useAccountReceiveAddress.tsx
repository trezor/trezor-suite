import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceInViewOnlyMode, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import {
    type AccountsRootState,
    type TransactionsRootState,
    confirmAddressOnDeviceThunk,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { type NativeAccountsRootState, selectFreshAccountAddress } from '@suite-native/accounts';
import { useAlert } from '@suite-native/alerts';
import { events } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

export const useAccountReceiveAddress = (accountKey: AccountKey) => {
    const dispatch = useDispatch();
    const [isReceiveApproved, setIsReceiveApproved] = useState(false);
    const [isUnverifiedAddressRevealed, setIsUnverifiedAddressRevealed] = useState(false);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const navigation = useNavigation();
    const analytics = useAnalytics();
    const { showToast } = useToast();

    const { showAlert } = useAlert();

    const symbol = useSelector((state: AccountsRootState) =>
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

    const handleShowAddress = useCallback(async () => {
        if (isPortfolioTrackerDevice) {
            if (symbol) {
                analytics.report({
                    type: events.createReceiveAddressShowAddressEvent.name,
                    payload: { assetSymbol: symbol },
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
                analytics.report({ type: events.receiveAddressConfirmOnTrezorEvent.name });
                setIsReceiveApproved(true);
            } else {
                setIsUnverifiedAddressRevealed(false);
            }
        }
    }, [
        analytics,
        isDeviceInViewOnlyMode,
        isPortfolioTrackerDevice,
        symbol,
        verifyAddressOnDevice,
    ]);

    return {
        address: freshAddress?.address,
        isReceiveApproved,
        isUnverifiedAddressRevealed,
        handleShowAddress,
    };
};
