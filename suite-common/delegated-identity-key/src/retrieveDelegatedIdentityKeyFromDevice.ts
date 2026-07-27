import {
    DeviceCancelledErr,
    DeviceError,
    DeviceNotConnectedError,
    isCanceledErrorMessage,
} from '@suite-common/device';
import {
    type DelegatedIdentityKey,
    type DeviceCancelledErrType,
    type DeviceErrorType,
    type DeviceNotConnectedErrorType,
    type TrezorDeviceWithState,
    asDelegatedIdentityKey,
} from '@suite-common/suite-types';
import type TrezorConnect from '@trezor/connect';
import { type Result, err, ok } from '@trezor/type-utils';

export type RetrieveDelegatedIdentityKeyParams = {
    device: Pick<
        TrezorDeviceWithState,
        'path' | 'state' | 'instance' | 'useEmptyPassphrase' | 'connected'
    >;
};

export type RetrieveDelegatedIdentityKeyFromDeviceDeps = {
    trezorConnect: Pick<typeof TrezorConnect, 'evoluGetDelegatedIdentityKey'>;
};

type RetrieveDelegatedIdentityKeyFromDevice = (
    params: RetrieveDelegatedIdentityKeyParams,
) => Promise<
    Result<
        DelegatedIdentityKey,
        DeviceCancelledErrType | DeviceErrorType | DeviceNotConnectedErrorType
    >
>;

export type RetrieveDelegatedIdentityKeyFromDeviceDep = {
    retrieveDelegatedIdentityKeyFromDevice: RetrieveDelegatedIdentityKeyFromDevice;
};

export const createRetrieveDelegatedIdentityKeyFromDevice =
    (deps: RetrieveDelegatedIdentityKeyFromDeviceDeps): RetrieveDelegatedIdentityKeyFromDevice =>
    async ({ device }) => {
        if (!device.connected) {
            return err(
                DeviceNotConnectedError(
                    'Device not connected: createRetrieveDelegatedIdentityKeyFromDevice',
                ),
            );
        }

        const result = await deps.trezorConnect.evoluGetDelegatedIdentityKey({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance ?? 0,
                useEmptyPassphrase: device.useEmptyPassphrase ?? false,
            },
        });

        if (result.success) {
            return ok(asDelegatedIdentityKey(result.payload.private_key));
        }

        if (isCanceledErrorMessage(result.error.message)) {
            return err(DeviceCancelledErr());
        }

        return err(DeviceError(result.error.message));
    };
