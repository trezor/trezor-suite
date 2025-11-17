import { Dispatch } from '@reduxjs/toolkit';

import { TrezorDeviceWithState, asDelegatedIdentityKey } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { deviceActions } from '../deviceActions';
import { selectPersistentDeviceData } from '../deviceSelectors';
import { isCanceledErrorMessage } from '../deviceUtils';

type RetrieveDelegatedIdentityKeyParams = {
    device: TrezorDeviceWithState;
};

const retrieveDelegatedIdentityKey = async ({ device }: RetrieveDelegatedIdentityKeyParams) => {
    const result = await TrezorConnect.evoluGetDelegatedIdentityKey({
        device: {
            path: device.path,
            state: device.state,
            instance: device.instance ?? 0,
        },
        useEmptyPassphrase: device.useEmptyPassphrase ?? false,
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
export const retrieveDelegatedIdentityKeyThunk =
    ({ device }: RetrieveDelegatedIdentityKeyThunkParams) =>
    async (dispatch: Dispatch, getState: () => any) => {
        const persistedData = selectPersistentDeviceData(getState());
        const devicePersistedData = persistedData.find(it => it.device_id === device.id);
        const currentDelegatedKey = devicePersistedData?.delegatedIdentityKey ?? null;

        if (currentDelegatedKey === null) {
            const result = await retrieveDelegatedIdentityKey({ device });

            if (!result.ok) {
                dispatch(
                    deviceActions.setDelegatedIdentityKey({
                        deviceId: device.id,
                        delegatedKey: null,
                    }),
                );

                return result;
            }

            dispatch(
                deviceActions.setDelegatedIdentityKey({
                    deviceId: device.id,
                    delegatedKey: result.value,
                }),
            );

            return ok(result.value);
        }

        return ok(currentDelegatedKey);
    };
