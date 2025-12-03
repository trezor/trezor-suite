import { Dispatch } from '@reduxjs/toolkit';

import { ExtraDependencies } from '@suite-common/redux-utils';
import { TrezorDeviceWithState, asDelegatedIdentityKey } from '@suite-common/suite-types';
// Circular issue, see: https://github.com/trezor/trezor-suite/issues/21553
import { selectThp } from '@suite-common/thp/src/thpSelectors';
import TrezorConnect from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { deviceActions } from '../deviceActions';
import { selectPersistentDeviceData } from '../deviceSelectors';
import { isCanceledErrorMessage } from '../deviceUtils';

type RetrieveDelegatedIdentityKeyParams = {
    device: TrezorDeviceWithState;
    thpStaticHostKey: string | undefined;
};

const retrieveDelegatedIdentityKey = async ({
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
        return err({ type: 'DeviceCancelled' as const });
    }

    return err({
        type: 'DeviceError' as const,
        message: result.payload.error,
    });
};

type RetrieveDelegatedIdentityKeyThunkParams = {
    device: TrezorDeviceWithState;
};

/**
 * Intentionally no `createThunk`, it is unnecessarily complicated, all we need is `Result` type.
 *
 * This is part of the experiment here: https://github.com/trezor/trezor-suite/issues/23202
 */
export const ensureDelegatedIdentityKeyThunk =
    ({ device }: RetrieveDelegatedIdentityKeyThunkParams) =>
    async (dispatch: Dispatch, getState: () => any, extra: ExtraDependencies) => {
        const persistedData = selectPersistentDeviceData(getState());
        const devicePersistedData = persistedData.find(it => it.device_id === device.id);

        const encryptedCurrentDelegatedKey = devicePersistedData?.delegatedIdentityKey ?? null;

        const currentDelegatedKey =
            encryptedCurrentDelegatedKey !== null
                ? await extra.services.secureStorage.decrypt({
                      value: encryptedCurrentDelegatedKey,
                  })
                : null;

        if (currentDelegatedKey === null || !currentDelegatedKey.ok) {
            const thpStaticHostKey = selectThp(getState()).staticKey;
            const result = await retrieveDelegatedIdentityKey({ device, thpStaticHostKey });

            if (!result.ok) {
                dispatch(
                    deviceActions.setDelegatedIdentityKey({
                        deviceId: device.id,
                        delegatedKey: null,
                    }),
                );

                return result;
            }

            const encryptedDelegatedKey = await extra.services.secureStorage.encrypt({
                value: result.value,
            });

            if (!encryptedDelegatedKey.ok) {
                return encryptedDelegatedKey;
            }

            dispatch(
                deviceActions.setDelegatedIdentityKey({
                    deviceId: device.id,
                    delegatedKey: encryptedDelegatedKey.value,
                }),
            );

            return ok(result.value);
        }

        return ok(currentDelegatedKey.value);
    };
