import { Dispatch } from '@reduxjs/toolkit';

import { TrezorDeviceWithState, asDelegatedIdentityKey } from '@suite-common/suite-types';
// Circular issue, see: https://github.com/trezor/trezor-suite/issues/21553
import { selectThp } from '@suite-common/thp/src/thpSelectors';
import type { TrezorConnect } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { deviceActions } from '../deviceActions';
import { selectPersistentDeviceData } from '../deviceSelectors';
import { isCanceledErrorMessage } from '../deviceUtils';

type RetrieveDelegatedIdentityKey = {
    connect: TrezorConnect;
};

type RetrieveDelegatedIdentityKeyParams = {
    device: TrezorDeviceWithState;
    thpStaticHostKey: string | undefined;
};

const retrieveDelegatedIdentityKey =
    (deps: RetrieveDelegatedIdentityKey) =>
    async ({ device, thpStaticHostKey }: RetrieveDelegatedIdentityKeyParams) => {
        const thpCredential = device.thp?.credentials?.[0].credential;

        const result = await deps.connect.evoluGetDelegatedIdentityKey({
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

type RetrieveDelegatedIdentityKeyThunkDeps = {
    dispatch: Dispatch;
    getState: () => any;
    connect: TrezorConnect;
};

/**
 * Intentionally no `createThunk`, it is unnecessarily complicated, all we need is `Result` type.
 *
 * This is part of the experiment here: https://github.com/trezor/trezor-suite/issues/23202
 */
export const retrieveDelegatedIdentityKeyThunk =
    (deps: RetrieveDelegatedIdentityKeyThunkDeps) =>
    async ({ device }: RetrieveDelegatedIdentityKeyThunkParams) => {
        const persistedData = selectPersistentDeviceData(deps.getState());
        const devicePersistedData = persistedData.find(it => it.device_id === device.id);
        const currentDelegatedKey = devicePersistedData?.delegatedIdentityKey ?? null;

        const thpStaticHostKey = selectThp(deps.getState()).staticKey;

        if (currentDelegatedKey === null) {
            const result = await retrieveDelegatedIdentityKey({ connect: deps.connect })({
                device,
                thpStaticHostKey,
            });

            if (!result.ok) {
                deps.dispatch(
                    deviceActions.setDelegatedIdentityKey({
                        deviceId: device.id,
                        delegatedKey: null,
                    }),
                );

                return result;
            }

            deps.dispatch(
                deviceActions.setDelegatedIdentityKey({
                    deviceId: device.id,
                    delegatedKey: result.value,
                }),
            );

            return ok(result.value);
        }

        return ok(currentDelegatedKey);
    };
