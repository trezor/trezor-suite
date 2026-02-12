import { useSelector } from 'react-redux';

import { selectIsBluetoothSupportedByDevice } from '@suite-common/device';
import { selectBluetoothPermissionStatus } from '@suite-native/bluetooth';
import {
    ConnectAndUnlockDeviceScreenContent,
    TurnOnAndUnlockDeviceScreenContent,
} from '@suite-native/device';
import { Screen } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { ConnectDeviceScreenHeader } from '../components/ConnectDeviceScreenHeader';

type DeviceConnectionGuardScreenParams = {
    onCancel?: () => void;
};

export const DeviceConnectionGuardScreen = ({ onCancel }: DeviceConnectionGuardScreenParams) => {
    const bluetoothPermissionStatus = useSelector(selectBluetoothPermissionStatus);
    const isBluetoothSupportedByDevice = useSelector(selectIsBluetoothSupportedByDevice);

    const isBluetoothVariantVisible =
        bluetoothPermissionStatus === 'granted' && isBluetoothSupportedByDevice;

    return (
        <Screen header={<ConnectDeviceScreenHeader onCancel={onCancel} />} isScrollable={false}>
            {isBluetoothVariantVisible ? (
                <TurnOnAndUnlockDeviceScreenContent />
            ) : (
                <ConnectAndUnlockDeviceScreenContent />
            )}
        </Screen>
    );
};

export const DeviceConnectionGuardScreenWithCancel = () => (
    <DeviceConnectionGuardScreen onCancel={TrezorConnect.cancel} />
);
