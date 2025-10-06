import { bluetoothActions, selectAdapterStatus } from '@suite-common/bluetooth';
import * as deviceUtils from '@suite-common/suite-utils';
import { selectDevices } from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { setConnectionMode, toggleConnectionModal } from 'src/actions/device/deviceSlice';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { ForegroundAppProps } from 'src/types/suite';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { SwitchDeviceModal } from './SwitchDeviceModal';

export const SwitchDevice = ({ cancelable, onCancel }: ForegroundAppProps) => {
    const dispatch = useDispatch();
    const bluetoothAdapterStatus = useSelector(selectAdapterStatus);
    const devices = useSelector(selectDevices);

    // exclude selectedDevice from list, because other devices could have a higher priority,
    // and we want to have selectedDevice on top
    const sortedDevices = deviceUtils.getFirstDeviceInstance(devices, {
        sortingFn: deviceUtils.sortDevicesForDeviceList,
    });

    const openDeviceConnectionModal = () => {
        dispatch(toggleConnectionModal());

        if (bluetoothAdapterStatus === 'enabled') {
            dispatch(bluetoothActions.enableAutoConnect());
            dispatch(setConnectionMode('bluetooth'));
        }

        onCancel();
    };

    return (
        <SwitchDeviceModal isAnimationEnabled onCancel={cancelable ? onCancel : undefined}>
            <Column gap={spacings.md}>
                {sortedDevices.map(device => (
                    <DeviceItem
                        key={`${device.path}-${device.id}-${device.instance}`}
                        device={device}
                        instances={deviceUtils.getDeviceInstances(device, devices)}
                        onCancel={cancelable ? onCancel : undefined}
                    />
                ))}
                <Button
                    variant="tertiary"
                    icon="trezorDevices"
                    isFullWidth
                    onClick={openDeviceConnectionModal}
                >
                    <Translation id="TR_CONNECT_DEVICE" />
                </Button>
            </Column>
        </SwitchDeviceModal>
    );
};
