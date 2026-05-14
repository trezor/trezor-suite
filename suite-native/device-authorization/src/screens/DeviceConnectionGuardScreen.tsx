import { useSelector } from 'react-redux';

import { selectIsBluetoothSupportedByDevice } from '@suite-common/device';
import { selectBluetoothPermissionStatus } from '@suite-native/bluetooth';
import {
    ConnectAndUnlockDeviceScreenContent,
    TurnOnAndUnlockDeviceScreenContent,
} from '@suite-native/device';
import { Screen, useNavigateToInitialScreen } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { ConnectDeviceScreenHeader } from '../components/ConnectDeviceScreenHeader';
import { useOnThpPairingCanceled } from '../hooks/useOnThpPairingCanceled';

type DeviceConnectionGuardScreenParams = {
    onCancel?: () => void;
};

export const DeviceConnectionGuardScreen = ({ onCancel }: DeviceConnectionGuardScreenParams) => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const bluetoothPermissionStatus = useSelector(selectBluetoothPermissionStatus);
    const isBluetoothSupportedByDevice = useSelector(selectIsBluetoothSupportedByDevice);

    const isBluetoothVariantVisible =
        bluetoothPermissionStatus === 'granted' && isBluetoothSupportedByDevice;

    useOnThpPairingCanceled(navigateToInitialScreen);

    const defaultOnCancel = () => {
        TrezorConnect.cancel();
        navigateToInitialScreen();
    };

    return (
        <Screen
            header={<ConnectDeviceScreenHeader onCancel={onCancel ?? defaultOnCancel} />}
            isScrollable={false}
        >
            {isBluetoothVariantVisible ? (
                <TurnOnAndUnlockDeviceScreenContent />
            ) : (
                <ConnectAndUnlockDeviceScreenContent />
            )}
        </Screen>
    );
};
