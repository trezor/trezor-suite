import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
// TODO fix deep import
// eslint-disable-next-line local-rules/no-package-deep-imports
import { type ConnectPopupCall } from '@suite-common/connect-popup/src/connectPopupTypes';
import {
    selectDeviceButtonRequests,
    selectIsDeviceConnectedAndAuthorized,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/device';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Box } from '@suite-native/atoms';
import { DeviceManager } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { AddressConfirmation } from '../components/AddressConfirmation';
import { ConnectConfirmOnTrezor } from '../components/ConnectConfirmOnTrezor';
import { ConnectErrorMessage } from '../components/ConnectErrorMessage';
import { ConnectLoader } from '../components/ConnectLoader';
import { PermissionConfirmation } from '../components/PermissionConfirmation';
import { TxSimulation } from '../components/TxSimulation';

export const ConnectPopupScreen = () => {
    const navigation = useNavigation();

    const { dispatch } = useServices(injectDispatch);
    const deviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const validDevice = deviceConnectedAndAuthorized && !isPortfolioTrackerDevice;
    const discoveryActive = useSelector(selectHasRunningDiscovery);
    const popupCall = useSelector(selectConnectPopupCall);
    const buttonRequests = useSelector(selectDeviceButtonRequests);
    const [addressConfirmation, setAddressConfirmation] = useState<
        (ConnectPopupCall & { state: 'address-confirmation' }) | null
    >();

    useEffect(() => {
        // Reset the popup call when the screen is mounted
        // Hold and restore address confirmation state during deep link callback
        if (popupCall?.state == 'address-confirmation') {
            setAddressConfirmation(popupCall);
        }
        if (popupCall?.state == 'deeplink-callback' && addressConfirmation) {
            dispatch(connectPopupActions.confirmAddresses(addressConfirmation));
            setAddressConfirmation(null);
        }
        // If the popup call is finished we can exit the screen
        if (popupCall?.state == 'finished' && navigation.canGoBack()) {
            setAddressConfirmation(null);
            navigation.goBack();
        }
    }, [popupCall, navigation, addressConfirmation, dispatch]);

    // A declined call does not need the device, so its reason is shown right away.
    const isConnectV9Refusal =
        popupCall?.state === 'call-error' && popupCall.isConnectV9Refusal === true;
    const isLoading =
        !isConnectV9Refusal &&
        (discoveryActive || !validDevice || !popupCall || popupCall.state === 'ongoing');
    const mainView = useMemo(() => {
        if (isConnectV9Refusal) {
            return <ConnectErrorMessage />;
        }

        if (discoveryActive) {
            return (
                <ConnectLoader
                    title={
                        <Translation id="moduleConnectPopup.connectionStatus.discoveryRunning" />
                    }
                />
            );
        }

        if (!validDevice) {
            return (
                <ConnectLoader
                    title={<Translation id="moduleConnectPopup.errors.deviceNotConnected" />}
                />
            );
        }

        if (popupCall?.state === 'permission-request') {
            return <PermissionConfirmation />;
        }

        if (popupCall?.state === 'address-confirmation') {
            return <AddressConfirmation />;
        }

        if (popupCall?.state === 'tx-simulation') {
            return <TxSimulation />;
        }

        if (popupCall?.state === 'call-error' || popupCall?.state === 'error') {
            return <ConnectErrorMessage />;
        }

        if (buttonRequests.length > 0) {
            return <ConnectConfirmOnTrezor />;
        }

        return (
            <ConnectLoader
                title={<Translation id="moduleConnectPopup.connectionStatus.loading" />}
            />
        );
    }, [validDevice, popupCall, discoveryActive, buttonRequests, isConnectV9Refusal]);

    return (
        <Screen>
            <Box>
                <DeviceManager />
            </Box>

            <Box
                paddingTop="sp16"
                flex={1}
                justifyContent={isLoading ? 'center' : 'flex-start'}
                alignItems={isLoading ? 'center' : 'stretch'}
            >
                {mainView}
            </Box>
        </Screen>
    );
};
