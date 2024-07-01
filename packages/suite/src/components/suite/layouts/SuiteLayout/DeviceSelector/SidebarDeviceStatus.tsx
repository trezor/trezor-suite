import { MouseEventHandler } from 'react';
import { acquireDevice, selectDevice } from '@suite-common/wallet-core';
import * as deviceUtils from '@suite-common/suite-utils';
import { TrezorDevice } from 'src/types/suite';
import { useDispatch, useSelector } from '../../../../../hooks/suite';
import { DeviceStatus } from './DeviceStatus';

const needsRefresh = (device?: TrezorDevice) => {
    if (!device) return false;

    const deviceStatus = deviceUtils.getStatus(device);
    const needsAcquire =
        device.type === 'unacquired' ||
        deviceStatus === 'used-in-other-window' ||
        deviceStatus === 'was-used-in-other-window';

    return needsAcquire;
};

export const SidebarDeviceStatus = () => {
    const selectedDevice = useSelector(selectDevice);

    const dispatch = useDispatch();

    const deviceNeedsRefresh = needsRefresh(selectedDevice);

    const handleRefreshClick: MouseEventHandler = e => {
        e.stopPropagation();
        if (deviceNeedsRefresh) {
            dispatch(acquireDevice(selectedDevice));
        }
    };

    const selectedDeviceModelInternal = selectedDevice?.features?.internal_model;

    if (!selectedDevice || !selectedDeviceModelInternal) {
        return null;
    }

    return (
        <DeviceStatus
            deviceModel={selectedDeviceModelInternal}
            deviceNeedsRefresh={deviceNeedsRefresh}
            device={selectedDevice}
            handleRefreshClick={handleRefreshClick}
        />
    );
};
