import { type RouterRootState, selectRouterApp } from '@suite/router';
import type { TrezorDevice } from '@suite-common/suite-types';

import { SHOULD_ROUTER_APP_START_DISCOVERY } from './config';

type IsDeviceBecomingAcquiredParams = {
    prevDevice: TrezorDevice;
    device: TrezorDevice;
};
export const isDeviceBecomingAcquired = ({ prevDevice, device }: IsDeviceBecomingAcquiredParams) =>
    prevDevice.features === undefined && device.features !== undefined;

export const isDeviceBecomingConnected = ({ prevDevice, device }: IsDeviceBecomingAcquiredParams) =>
    !prevDevice.connected && device.connected;

export const selectShouldRouterAppStartDiscovery = (state: RouterRootState) =>
    SHOULD_ROUTER_APP_START_DISCOVERY[selectRouterApp(state)];
