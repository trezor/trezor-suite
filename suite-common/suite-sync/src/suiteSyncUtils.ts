import { type TrezorDevice } from '@suite-common/suite-types';
import { type Device } from '@trezor/connect';

export const isSuiteSyncSupportedByDevice = (device: Device | TrezorDevice | undefined) =>
    device?.unavailableCapabilities?.evolu === undefined;
