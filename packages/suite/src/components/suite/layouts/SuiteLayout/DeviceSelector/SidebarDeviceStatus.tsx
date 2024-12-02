import { MouseEventHandler } from 'react';

import { acquireDevice, selectDevice, selectDevices } from '@suite-common/wallet-core';
import * as deviceUtils from '@suite-common/suite-utils';

import { TrezorDevice } from 'src/types/suite';

import { useDispatch, useSelector } from '../../../../../hooks/suite';
import { DeviceStatus } from './DeviceStatus';
import { useIsSidebarCollapsed } from '../Sidebar/utils';

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
    const devices = useSelector(selectDevices);
    const dispatch = useDispatch();
    const isSidebarCollapsed = useIsSidebarCollapsed();

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
    const instances = deviceUtils.getDeviceInstances(selectedDevice, devices);
    const instancesWithState = instances.filter(i => i.state);

    const isConnectionShown =
        instancesWithState.length === 1 && selectedDevice.useEmptyPassphrase === true;

    return (
        <DeviceStatus
            deviceModel={selectedDeviceModelInternal}
            deviceNeedsRefresh={deviceNeedsRefresh}
            device={selectedDevice}
            handleRefreshClick={handleRefreshClick}
            forceConnectionInfo={isConnectionShown}
            isDeviceDetailVisible={!isSidebarCollapsed}
        />
    );
};
