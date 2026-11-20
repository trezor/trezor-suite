import {
    type DelegatedIdentityKey,
    type TrezorDeviceWithState,
    asDelegatedIdentityKey,
} from '@suite-common/suite-types';
import { type GetTrezorConnectDep } from '@trezor/connect-common';
import {
    DeviceCancelledErr,
    type DeviceCancelledErrType,
    DeviceError,
    type DeviceErrorType,
    DeviceNotConnectedError,
    type DeviceNotConnectedErrorType,
    isCanceledErrorMessage,
} from '@trezor/device';
import { type Result, err, ok } from '@trezor/type-utils';

export type RetrieveDelegatedIdentityKeyParams = {
    device: Pick<
        TrezorDeviceWithState,
        'path' | 'state' | 'instance' | 'useEmptyPassphrase' | 'connected'
    >;
};

export type RetrieveDelegatedIdentityKeyFromDeviceDeps =
    GetTrezorConnectDep<'evoluGetDelegatedIdentityKey'>;

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

        const result = await deps.getTrezorConnect().evoluGetDelegatedIdentityKey({
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
