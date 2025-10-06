import * as deviceUtils from '@suite-common/suite-utils';
import { selectDevices } from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { setConnectionMode, toggleConnectionModal } from 'src/actions/device/deviceSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { ForegroundAppProps } from 'src/types/suite';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { SwitchDeviceModal } from './SwitchDeviceModal';

export const SwitchDevice = ({ cancelable, onCancel }: ForegroundAppProps) => {
    const dispatch = useDispatch();

    const devices = useSelector(selectDevices);

    // exclude selectedDevice from list, because other devices could have a higher priority,
    // and we want to have selectedDevice on top
    const sortedDevices = deviceUtils.getFirstDeviceInstance(devices, {
        sortingFn: deviceUtils.sortDevicesForDeviceList,
    });

    const openDeviceConnectionModal = () => {
        dispatch(setConnectionMode('bluetooth'));
        dispatch(toggleConnectionModal());
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
                    icon="bluetooth"
                    isFullWidth
                    onClick={openDeviceConnectionModal}
                >
                    Pair Trezor Safe 7
                </Button>
            </Column>
        </SwitchDeviceModal>
    );
};
