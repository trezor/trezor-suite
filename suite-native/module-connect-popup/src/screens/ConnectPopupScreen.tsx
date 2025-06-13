import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import { ConnectPopupCall } from '@suite-common/connect-popup/src/connectPopupTypes';
import {
    selectHasRunningDiscovery,
    selectIsDeviceConnectedAndAuthorized,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { Box, Button, ErrorMessage, Loader } from '@suite-native/atoms';
import { DeviceManager } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { AddressConfirmation } from '../components/AddressConfirmation';
import { ButtonRequestsOverlay } from '../components/ButtonRequestsOverlay';
import { PermissionConfirmation } from '../components/PermissionConfirmation';
import { TxSimulation } from '../components/TxSimulation';

export const ConnectPopupScreen = () => {
    const navigation = useNavigation();

    const dispatch = useDispatch();
    const deviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const validDevice = deviceConnectedAndAuthorized && !isPortfolioTrackerDevice;
    const discoveryActive = useSelector(selectHasRunningDiscovery);
    const popupCall = useSelector(selectConnectPopupCall);
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

    const isLoading =
        discoveryActive || !validDevice || !popupCall || popupCall.state === 'ongoing';
    const mainView = useMemo(() => {
        if (discoveryActive) {
            return (
                <Loader
                    size="large"
                    title={
                        <Translation id="moduleConnectPopup.connectionStatus.discoveryRunning" />
                    }
                />
            );
        }

        if (!validDevice) {
            return (
                <Loader
                    size="large"
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

        if (popupCall?.state === 'call-error') {
            const getErrorMessage = () => {
                switch (popupCall.error.code) {
                    case 'Deeplink_VersionMismatch':
                        return <Translation id="moduleConnectPopup.errors.versionUnsupported" />;
                    case 'Method_NotAllowed':
                        return <Translation id="moduleConnectPopup.errors.methodNotAllowed" />;
                    case 'Device_NotFound':
                        return <Translation id="moduleConnectPopup.errors.deviceNotConnected" />;
                    case 'Method_Interrupted':
                    case 'Method_Cancel':
                    case 'Failure_ActionCancelled':
                        return <Translation id="moduleConnectPopup.errors.methodCanceled" />;
                    case 'Method_InvalidParameter':
                        return <Translation id="moduleConnectPopup.errors.invalidParams" />;
                    default:
                        return <Translation id="moduleConnectPopup.errors.unknownError" />;
                }
            };
            const onClose = () => {
                if (navigation.canGoBack()) {
                    navigation.goBack();
                }
            };

            return (
                <>
                    <ErrorMessage errorMessage={getErrorMessage()} />
                    <Button
                        testID="@popup/close"
                        onPress={onClose}
                        colorScheme="tertiaryElevation0"
                    >
                        <Translation id="generic.buttons.close" />
                    </Button>
                </>
            );
        }

        return (
            <Loader
                size="large"
                title={<Translation id="moduleConnectPopup.connectionStatus.loading" />}
            />
        );
    }, [validDevice, popupCall, discoveryActive, navigation]);

    return (
        <Screen>
            <Box>
                <DeviceManager />
            </Box>

            <Box
                padding="sp8"
                paddingTop="sp16"
                flex={1}
                justifyContent={isLoading ? 'center' : 'flex-start'}
                alignItems={isLoading ? 'center' : 'stretch'}
            >
                {mainView}
            </Box>

            <ButtonRequestsOverlay />
        </Screen>
    );
};
