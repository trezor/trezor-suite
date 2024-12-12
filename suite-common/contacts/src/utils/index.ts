import { TrezorDevice } from '@suite-common/suite-types';

export * from './findContact';

export const getDeviceState = (device: TrezorDevice) =>
    device.state?.staticSessionId?.split('@')?.[0];
