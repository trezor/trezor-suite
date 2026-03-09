import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { bluetoothActions, selectAdapterStatus } from '@suite-common/bluetooth';
import { selectDevices } from '@suite-common/device';
import * as deviceUtils from '@suite-common/suite-utils';
import { Box, Button, Column } from '@trezor/components';

import { setConnectionMode, toggleConnectionModal } from 'src/actions/device/deviceSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { ForegroundAppProps } from 'src/types/suite';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { SwitchDeviceModal } from './SwitchDeviceModal';

export const SwitchDeviceContent = ({ cancelable, onCancel }: ForegroundAppProps) => {
    const analytics = useAnalytics();
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

        analytics.report({
            type: events.deviceConnectionConnectButtonEvent.name,
            payload: {
                option: 'dropdown',
            },
        });

        onCancel();
    };

    return (
        <Column gap={12}>
            {sortedDevices.map(device => (
                <DeviceItem
                    key={`${device.path}-${device.id}-${device.walletNumber}`}
                    device={device}
                    instances={deviceUtils.getDeviceInstances(device, devices)}
                    onCancel={cancelable ? onCancel : undefined}
                />
            ))}
            <Box backgroundColor="backgroundSurfaceElevation1" borderRadius={12}>
                <Button
                    intent="neutral"
                    priority="secondary"
                    iconLeft="trezorDevices"
                    width="100%"
                    size="large"
                    onClick={openDeviceConnectionModal}
                >
                    <Translation id="TR_CONNECT_DEVICE" />
                </Button>
            </Box>
        </Column>
    );
};

export const SwitchDevice = ({ cancelable, onCancel }: ForegroundAppProps) => (
    <SwitchDeviceModal isAnimationEnabled onCancel={cancelable ? onCancel : undefined}>
        <SwitchDeviceContent cancelable={cancelable} onCancel={onCancel} />
    </SwitchDeviceModal>
);
