import { isTrezorDeviceWithState } from '@suite-common/device';
import { type TrezorDevice, type TrezorDeviceWithState } from '@suite-common/suite-types';
import { DeviceNotConnectedError, type DeviceNotConnectedErrorType } from '@trezor/device';
import { type Result, err, ok } from '@trezor/type-utils';

export const getReadyDevice = (
    device: TrezorDevice | undefined,
    operation: 'signMessage' | 'verifyMessage',
): Result<TrezorDeviceWithState, DeviceNotConnectedErrorType> =>
    isTrezorDeviceWithState(device) && device.connected && device.available
        ? ok(device)
        : err(DeviceNotConnectedError(`Device not connected: ${operation}`));
