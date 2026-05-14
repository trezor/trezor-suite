import React, { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { selectIsDeviceOrUiLocked } from '@suite/locks';
import { selectKnownDeviceByDeviceId } from '@suite-common/bluetooth/src/bluetoothSelectors';
import { selectDevices } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';

import { selectConnectingDevices } from 'src/actions/bluetooth/desktopBluetoothSelectors';
import { useSelector } from 'src/hooks/suite';

import { DeviceConnectionText } from './DeviceConnectionText';
import { DeviceStatusTextVisible } from './DeviceStatusTextVisible';

type DeviceStatusTextThpProps = {
    device: TrezorDevice;
    forceConnectionInfo: boolean;
};

export const DeviceStatusTextThp = ({ device, forceConnectionInfo }: DeviceStatusTextThpProps) => {
    const { connected } = device;

    const allDevices = useSelector(selectDevices);
    const bluetoothConnecting = useSelector(selectConnectingDevices);
    const bluetoothDevice = useSelector(state =>
        selectKnownDeviceByDeviceId(state, device.id ?? undefined),
    );
    const isDeviceOrUiLocked = useSelector(selectIsDeviceOrUiLocked);
    const isBtConnecting =
        !device.connected &&
        (bluetoothConnecting.some(btId => btId === bluetoothDevice?.id) ||
            bluetoothDevice?.connectionStatus?.type === 'connecting');
    const isThpAcquiring =
        !device.connected &&
        isDeviceOrUiLocked &&
        allDevices.some(
            dev =>
                dev.descriptor.apiType === 'bluetooth' &&
                dev.descriptor.id === bluetoothDevice?.id &&
                dev.type === 'unacquired' &&
                dev.thp?.properties !== undefined,
        );

    const isLoading = isBtConnecting || isThpAcquiring;
    const [showThpStatus, setShowThpStatus] = useState(false);
    useEffect(() => {
        if (isLoading) {
            setShowThpStatus(true);
        } else {
            // keep the loading state for 3 more seconds to show "Connected" state for passphrase
            const timeout = setTimeout(() => setShowThpStatus(false), 3000);

            return () => clearTimeout(timeout);
        }
    }, [isLoading]);

    const getTextId = () => {
        if (device.connected) return 'TR_CONNECTED';
        if (isThpAcquiring) return 'TR_THP_LOADING';

        return 'TR_BLUETOOTH_CONNECTING';
    };

    if (showThpStatus) {
        return (
            <DeviceConnectionText
                intent={connected ? 'brand' : 'neutral'}
                priority={connected ? 'primary' : 'secondary'}
                icon="check"
                isLoading={isLoading}
                data-testid="@deviceStatus-connecting"
                data-testid-alt="@deviceStatus"
            >
                <Translation id={getTextId()} />
            </DeviceConnectionText>
        );
    }

    return <DeviceStatusTextVisible device={device} forceConnectionInfo={forceConnectionInfo} />;
};
