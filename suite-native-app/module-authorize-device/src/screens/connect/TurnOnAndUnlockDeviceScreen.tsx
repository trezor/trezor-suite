import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
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
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { BluetoothPairingAnimation } from '../../components/connect/BluetoothPairingAnimation';
import { BluetoothPairingSettings } from '../../components/connect/BluetoothPairingSettings';
import { ConnectDeviceScreen } from '../../components/connect/ConnectDeviceScreen';
import { HINTS_ALERT_DELAY } from '../../constants';

type NavigationProps = StackNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.TurnOnAndUnlockDevice
>;

export const TurnOnAndUnlockDeviceScreen = () => {
    const { showAlert, hideAlert } = useAlert();
    const navigation = useNavigation<NavigationProps>();

    const bluetoothAdapterStatus = useSelector(selectBluetoothAdapterStatus);
    const hasKnownBluetoothDevices = useSelector(selectHasKnownBluetoothDevices);
    const nearbyPairableBluetoothDevices = useSelector(selectNearbyPairableBluetoothDevices);

    const navigateToRemoveBluetoothDeviceScreen = useCallback(() => {
        navigation.replace(AuthorizeDeviceStackRoutes.RemoveBluetoothDevice);
    }, [navigation]);

    const showBluetoothPairingSettingsAlert = useCallback(() => {
        setTimeout(
            () =>
                showAlert({
                    type: 'bluetoothPairing',
                    title: (
                        <Translation id="moduleConnectDevice.helpModal.pairing.settings.title" />
                    ),
                    description: (
                        <Translation id="moduleConnectDevice.helpModal.pairing.settings.description" />
                    ),
                    primaryButtonTitle: (
                        <Translation id="moduleConnectDevice.helpModal.pairing.settings.pairAgainButton" />
                    ),
                    primaryButtonColorProps: { intent: 'info', priority: 'primary' },
                    onPressPrimaryButton: navigateToRemoveBluetoothDeviceScreen,
                    secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                    secondaryButtonColorProps: { intent: 'info', priority: 'secondary' },
                    onPressSecondaryButton: navigation.goBack,
                    appendix: <BluetoothPairingSettings />,
                }),
            1, // ensures the previous alert disappears first
        );
    }, [showAlert, navigateToRemoveBluetoothDeviceScreen, navigation]);

    const showBluetoothPairingHintsAlert = useCallback(() => {
        if (hasKnownBluetoothDevices) {
            showAlert({
                type: 'bluetoothPairing',
                title: <Translation id="moduleConnectDevice.helpModal.pairing.hints.title" />,
                description: (
                    <Translation id="moduleConnectDevice.helpModal.pairing.hints.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="moduleConnectDevice.helpModal.pairing.hints.stillNotWorkingButton" />
                ),
                primaryButtonColorProps: { intent: 'info', priority: 'primary' },
                onPressPrimaryButton: showBluetoothPairingSettingsAlert,
                secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                secondaryButtonColorProps: { intent: 'info', priority: 'secondary' },
                onPressSecondaryButton: navigation.goBack,
                appendix: <BluetoothPairingAnimation />,
            });
        } else {
            showAlert({
                type: 'bluetoothPairing',
                title: <Translation id="moduleConnectDevice.helpModal.pairing.hints.title" />,
                description: (
                    <Translation id="moduleConnectDevice.helpModal.pairing.hints.description" />
                ),
                primaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                primaryButtonColorProps: { intent: 'info', priority: 'secondary' },
                onPressPrimaryButton: navigation.goBack,
                appendix: <BluetoothPairingAnimation />,
            });
        }
    }, [showAlert, hasKnownBluetoothDevices, showBluetoothPairingSettingsAlert, navigation]);

    useFocusEffect(
        useCallback(() => {
            if (bluetoothAdapterStatus !== 'enabled') {
                return;
            }

            const timeoutId = setTimeout(showBluetoothPairingHintsAlert, HINTS_ALERT_DELAY);

            return () => {
                clearTimeout(timeoutId);
                hideAlert('bluetoothPairing');
            };
        }, [bluetoothAdapterStatus, showBluetoothPairingHintsAlert, hideAlert]),
    );

    useEffect(() => {
        if (nearbyPairableBluetoothDevices.length > 0) {
            navigation.navigate(AuthorizeDeviceStackRoutes.ConnectBluetoothDevice);
        }
    }, [nearbyPairableBluetoothDevices, hideAlert, navigation]);

    useBluetoothManager();

    return (
        <ConnectDeviceScreen closeActionType={Platform.select({ android: 'back' })}>
            <TurnOnAndUnlockDeviceScreenContent />
        </ConnectDeviceScreen>
    );
};
