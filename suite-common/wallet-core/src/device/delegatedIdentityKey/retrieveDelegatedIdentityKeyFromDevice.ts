import {
    DelegatedIdentityKey,
    TrezorDeviceWithState,
    asDelegatedIdentityKey,
} from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';
import { Result, err, ok } from '@trezor/type-utils';

import { DeviceCancelledErr, DeviceError, isCanceledErrorMessage } from '../deviceUtils';

export type RetrieveDelegatedIdentityKeyParams = {
    device: Pick<
        TrezorDeviceWithState,
        'path' | 'state' | 'instance' | 'useEmptyPassphrase' | 'thp'
    >;
    thpStaticHostKey: string | undefined;
};

export type RetrieveDelegatedIdentityKeyFromDeviceDeps = {
    trezorConnect: Pick<typeof TrezorConnect, 'evoluGetDelegatedIdentityKey'>;
};

type RetrieveDelegatedIdentityKeyFromDevice = (
    params: RetrieveDelegatedIdentityKeyParams,
) => Promise<Result<DelegatedIdentityKey, DeviceCancelledErr | DeviceError>>;

export type RetrieveDelegatedIdentityKeyFromDeviceDep = {
    retrieveDelegatedIdentityKeyFromDevice: RetrieveDelegatedIdentityKeyFromDevice;
};

export const createRetrieveDelegatedIdentityKeyFromDevice =
    (deps: RetrieveDelegatedIdentityKeyFromDeviceDeps): RetrieveDelegatedIdentityKeyFromDevice =>
    async ({ device, thpStaticHostKey }) => {
        const thpCredential = device.thp?.credentials?.[0].credential;

        const result = await deps.trezorConnect.evoluGetDelegatedIdentityKey({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance ?? 0,
            },
            useEmptyPassphrase: device.useEmptyPassphrase ?? false,
            ...(thpStaticHostKey !== undefined && thpCredential !== undefined
                ? {
                      thp: {
                          credential: thpCredential,
                          staticHostKey: thpStaticHostKey,
                      },
                  }
                : undefined),
        });

        if (result.success) {
            return ok(asDelegatedIdentityKey(result.payload.private_key));
        }

        if (isCanceledErrorMessage(result.payload.error)) {
            return err(DeviceCancelledErr());
        }

        return err(DeviceError(result.payload.error));
    };
