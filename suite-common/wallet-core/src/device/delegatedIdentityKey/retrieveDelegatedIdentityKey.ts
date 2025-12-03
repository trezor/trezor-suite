import { TrezorDeviceWithState, asDelegatedIdentityKey } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { DeviceCancelledErr, DeviceError, isCanceledErrorMessage } from '../deviceUtils';

type RetrieveDelegatedIdentityKeyParams = {
    device: TrezorDeviceWithState;
    thpStaticHostKey: string | undefined;
};

export const retrieveDelegatedIdentityKey = async ({
    device,
    thpStaticHostKey,
}: RetrieveDelegatedIdentityKeyParams) => {
    const thpCredential = device.thp?.credentials?.[0].credential;

    const result = await TrezorConnect.evoluGetDelegatedIdentityKey({
        device: {
            path: device.path,
            state: device.state,
            instance: device.instance ?? 0,
        },
        useEmptyPassphrase: device.useEmptyPassphrase ?? false,
        thp:
            thpStaticHostKey !== undefined && thpCredential !== undefined
                ? {
                      credential: thpCredential,
                      staticHostKey: thpStaticHostKey,
                  }
                : undefined,
    });

    if (result.success) {
        return ok(asDelegatedIdentityKey(result.payload.private_key));
    }

    if (isCanceledErrorMessage(result.payload.error)) {
        return err(DeviceCancelledErr());
    }

    return err(DeviceError(result.payload.error));
};
