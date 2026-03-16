import { selectDevices, selectSelectedDevice } from '@suite-common/device';
import * as deviceUtils from '@suite-common/suite-utils';
import { getDeviceInternalModel } from '@suite-common/suite-utils';

import { type TrezorDevice } from 'src/types/suite';

import { DeviceStatus } from './DeviceStatus';
import { useSelector } from '../../../../../hooks/suite';
import { useResponsiveContext } from '../../../../../support/suite/ResponsiveContext';

const needsRefresh = (device?: TrezorDevice) => {
    if (!device?.connected) return false;

    const deviceStatus = deviceUtils.getStatus(device);
    const needsAcquire = [
        'unacquired',
        'used-in-other-window',
        'was-used-in-other-window',
    ].includes(deviceStatus);

    return needsAcquire;
};

export const SidebarDeviceStatus = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const devices = useSelector(selectDevices);
    const { isSidebarCollapsed } = useResponsiveContext();

    const deviceNeedsRefresh = needsRefresh(selectedDevice);

    const selectedDeviceModelInternal = getDeviceInternalModel(selectedDevice);

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
            forceConnectionInfo={isConnectionShown}
            isDeviceDetailVisible={!isSidebarCollapsed}
        />
    );
};
