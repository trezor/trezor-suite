import * as deviceUtils from '@suite-common/suite-utils';
import { selectDevices } from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';
import { ForegroundAppProps } from 'src/types/suite';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { SwitchDeviceModal } from './SwitchDeviceModal';
import { setBluetoothListOpen } from '../../../actions/bluetooth/desktopBluetoothReducer';
import { selectIsBluetoothListOpen } from '../../../actions/bluetooth/desktopBluetoothSelectors';
import { BluetoothConnect } from '../../../components/suite/bluetooth/BluetoothConnect';

export const SwitchDevice = ({ cancelable, onCancel }: ForegroundAppProps) => {
    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);
    const isBluetoothMode = useSelector(selectIsBluetoothListOpen);
    const dispatch = useDispatch();

    const devices = useSelector(selectDevices);

    // exclude selectedDevice from list, because other devices could have a higher priority,
    // and we want to have selectedDevice on top
    const sortedDevices = deviceUtils.getFirstDeviceInstance(devices, {
        sortingFn: deviceUtils.sortDevicesForDeviceList,
    });

    const openBluetoothList = () => {
        dispatch(setBluetoothListOpen({ isOpen: true }));
    };

    return (
        <SwitchDeviceModal isAnimationEnabled onCancel={cancelable ? onCancel : undefined}>
            {isBluetoothMode ? (
                <BluetoothConnect uiMode="card" />
            ) : (
                <Column gap={spacings.md}>
                    {sortedDevices.map(device => (
                        <DeviceItem
                            key={`${device.path}-${device.id}-${device.instance}`}
                            device={device}
                            instances={deviceUtils.getDeviceInstances(device, devices)}
                            onCancel={cancelable ? onCancel : undefined}
                        />
                    ))}
                    {isBluetoothEnabled && (
                        <Button
                            variant="tertiary"
                            icon="bluetooth"
                            isFullWidth
                            onClick={openBluetoothList}
                        >
                            Pair Trezor Safe 7
                        </Button>
                    )}
                </Column>
            )}
        </SwitchDeviceModal>
    );
};
