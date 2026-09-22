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
import { useDeviceReadyEvents } from '../hooks/useDeviceReadyEvents';
import { useOnThpPairingCanceled } from '../hooks/useOnThpPairingCanceled';

type DeviceConnectionGuardScreenParams = {
    onCancel?: () => void;
};

export const DeviceConnectionGuardScreen = ({ onCancel }: DeviceConnectionGuardScreenParams) => {
    const { emitDeviceNotReadyEvent } = useDeviceReadyEvents();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const bluetoothPermissionStatus = useSelector(selectBluetoothPermissionStatus);
    const isBluetoothSupportedByDevice = useSelector(selectIsBluetoothSupportedByDevice);

    const isBluetoothVariantVisible =
        bluetoothPermissionStatus === 'granted' && isBluetoothSupportedByDevice;

    const handleCancel = () => {
        emitDeviceNotReadyEvent();
        navigateToInitialScreen();
    };

    useOnThpPairingCanceled(handleCancel);

    const defaultOnCancel = () => {
        TrezorConnect.cancel();
        handleCancel();
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
