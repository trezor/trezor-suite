import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import {
    selectBluetoothAdapterStatus,
    selectHasKnownBluetoothDevices,
    selectNearbyPairableBluetoothDevices,
    useBluetoothManager,
} from '@suite-native/bluetooth';
import { TurnOnAndUnlockDeviceScreenContent } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';
import { isAndroid } from '@trezor/env-utils';
import { TimerId } from '@trezor/type-utils';

import { BluetoothPairingHelpButton } from '../../components/connect/BluetoothPairingHelpButton';
import { BluetoothPairingHints } from '../../components/connect/BluetoothPairingHints';
import { ConnectDeviceScreenHeader } from '../../components/connect/ConnectDeviceScreenHeader';

type NavigationProps = StackNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.TurnOnAndUnlockDevice
>;

export const TurnOnAndUnlockDeviceScreen = () => {
    const { showAlert, hideAlert } = useAlert();
    const navigation = useNavigation<NavigationProps>();
    const timeoutIdRef = useRef<TimerId>(undefined);

    const bluetoothAdapterStatus = useSelector(selectBluetoothAdapterStatus);
    const hasKnownBluetoothDevices = useSelector(selectHasKnownBluetoothDevices);
    const nearbyPairableBluetoothDevices = useSelector(selectNearbyPairableBluetoothDevices);

    const navigateToConnectAndUnlockDeviceScreen = () => {
        navigation.replace(AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice);
    };

    const navigateToRemoveBluetoothDeviceScreen = useCallback(() => {
        navigation.replace(AuthorizeDeviceStackRoutes.RemoveBluetoothDevice);
    }, [navigation]);

    const setBluetoothPairingAlertTimeout = useCallback(() => {
        timeoutIdRef.current = setTimeout(
            () =>
                showAlert({
                    title: <Translation id="moduleConnectDevice.helpModal.pairing.altTitle" />,
                    primaryButtonTitle: (
                        <Translation id="moduleConnectDevice.helpModal.pairing.scanAgainButton" />
                    ),
                    primaryButtonVariant: 'blueBold',
                    onPressPrimaryButton: setBluetoothPairingAlertTimeout,
                    secondaryButtonTitle: (
                        <Translation
                            id={
                                hasKnownBluetoothDevices
                                    ? 'moduleConnectDevice.helpModal.pairing.stillNotWorkingButton'
                                    : 'generic.buttons.cancel'
                            }
                        />
                    ),
                    secondaryButtonVariant: 'blueElevation0',
                    onPressSecondaryButton: hasKnownBluetoothDevices
                        ? navigateToRemoveBluetoothDeviceScreen
                        : navigation.goBack,
                    appendix: <BluetoothPairingHints />,
                }),
            15_000,
        );
    }, [showAlert, hasKnownBluetoothDevices, navigateToRemoveBluetoothDeviceScreen, navigation]);

    const clearBluetoothPairingAlertTimeout = () => {
        clearTimeout(timeoutIdRef.current);
    };

    useFocusEffect(
        useCallback(() => {
            if (bluetoothAdapterStatus === 'enabled') {
                setBluetoothPairingAlertTimeout();

                return clearBluetoothPairingAlertTimeout;
            }
        }, [bluetoothAdapterStatus, setBluetoothPairingAlertTimeout]),
    );

    useEffect(() => {
        if (nearbyPairableBluetoothDevices.length > 0) {
            hideAlert();
            navigation.navigate(AuthorizeDeviceStackRoutes.ConnectBluetoothDevice);
        }
    }, [nearbyPairableBluetoothDevices, hideAlert, navigation]);

    useBluetoothManager();

    return (
        <Screen
            header={
                <ConnectDeviceScreenHeader
                    helpButton={
                        <BluetoothPairingHelpButton
                            onShowAlert={clearBluetoothPairingAlertTimeout}
                            onHideAlert={setBluetoothPairingAlertTimeout}
                        />
                    }
                />
            }
            noHorizontalPadding
            noBottomPadding
            hasBottomInset={false}
            isScrollable={false}
        >
            <TurnOnAndUnlockDeviceScreenContent
                onConnectViaCable={isAndroid() ? navigateToConnectAndUnlockDeviceScreen : undefined}
            />
        </Screen>
    );
};
