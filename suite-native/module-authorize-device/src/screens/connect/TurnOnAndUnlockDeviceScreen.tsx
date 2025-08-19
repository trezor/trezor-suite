import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import {
    selectBluetoothAdapterStatus,
    selectHasKnownBluetoothDevices,
    selectUnknownNearbyBluetoothDevices,
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
import { BluetoothPairingSettings } from '../../components/connect/BluetoothPairingSettings';
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
    const unknownNearbyDevices = useSelector(selectUnknownNearbyBluetoothDevices);

    const navigateToConnectAndUnlockDeviceScreen = () => {
        navigation.replace(AuthorizeDeviceStackRoutes.ConnectAndUnlockDeviceAuthorize);
    };

    const navigateToRemoveBluetoothDeviceScreen = useCallback(() => {
        navigation.replace(AuthorizeDeviceStackRoutes.RemoveBluetoothDevice);
    }, [navigation]);

    const showBluetoothPairingSettingsAlert = useCallback(() => {
        setTimeout(
            () =>
                showAlert({
                    title: (
                        <Translation id="moduleConnectDevice.helpModal.pairing.settings.title" />
                    ),
                    description: (
                        <Translation id="moduleConnectDevice.helpModal.pairing.settings.subtitle" />
                    ),
                    primaryButtonTitle: (
                        <Translation id="moduleConnectDevice.helpModal.pairing.settings.pairAgainButton" />
                    ),
                    primaryButtonVariant: 'blueBold',
                    onPressPrimaryButton: navigateToRemoveBluetoothDeviceScreen,
                    secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                    secondaryButtonVariant: 'blueElevation0',
                    onPressSecondaryButton: navigation.goBack,
                    appendix: <BluetoothPairingSettings />,
                }),
            1, // ensures the previous alert disappears first
        );
    }, [showAlert, navigateToRemoveBluetoothDeviceScreen, navigation]);

    const setBluetoothPairingHintsAlertTimeout = useCallback(() => {
        timeoutIdRef.current = setTimeout(
            () =>
                showAlert({
                    title: (
                        <Translation id="moduleConnectDevice.helpModal.pairing.hints.altTitle" />
                    ),
                    primaryButtonTitle: (
                        <Translation id="moduleConnectDevice.helpModal.pairing.hints.scanAgainButton" />
                    ),
                    primaryButtonVariant: 'blueBold',
                    onPressPrimaryButton: setBluetoothPairingHintsAlertTimeout,
                    secondaryButtonTitle: (
                        <Translation
                            id={
                                hasKnownBluetoothDevices
                                    ? 'moduleConnectDevice.helpModal.pairing.hints.stillNotWorkingButton'
                                    : 'generic.buttons.cancel'
                            }
                        />
                    ),
                    secondaryButtonVariant: 'blueElevation0',
                    onPressSecondaryButton: hasKnownBluetoothDevices
                        ? showBluetoothPairingSettingsAlert
                        : navigation.goBack,
                    appendix: <BluetoothPairingHints />,
                }),
            15_000,
        );
    }, [showAlert, hasKnownBluetoothDevices, showBluetoothPairingSettingsAlert, navigation]);

    const clearBluetoothPairingHintsAlertTimeout = () => {
        clearTimeout(timeoutIdRef.current);
    };

    useFocusEffect(
        useCallback(() => {
            if (bluetoothAdapterStatus === 'enabled') {
                setBluetoothPairingHintsAlertTimeout();

                return clearBluetoothPairingHintsAlertTimeout;
            }
        }, [bluetoothAdapterStatus, setBluetoothPairingHintsAlertTimeout]),
    );

    useEffect(() => {
        if (unknownNearbyDevices.length > 0) {
            hideAlert();
            navigation.navigate(AuthorizeDeviceStackRoutes.ConnectBluetoothDevice);
        }
    }, [unknownNearbyDevices, hideAlert, navigation]);

    useBluetoothManager();

    return (
        <Screen
            header={
                <ConnectDeviceScreenHeader
                    helpButton={
                        <BluetoothPairingHelpButton
                            onShowAlert={clearBluetoothPairingHintsAlertTimeout}
                            onHideAlert={setBluetoothPairingHintsAlertTimeout}
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
