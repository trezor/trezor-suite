import { createThunk } from '@suite-common/redux-utils';
import {
    DelegatedIdentityKey,
    TrezorDeviceWithState,
    asDelegatedIdentityKey,
} from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';
import { Result, err, ok } from '@trezor/type-utils';

import { DEVICE_MODULE_PREFIX, deviceActions } from '../deviceActions';
import { selectPersistentDeviceData } from '../deviceSelectors';
import { isCanceledErrorMessage } from '../deviceUtils';

type RetrieveResult = {
    message: string;
    canceled: boolean;
};

type RetrieveDelegatedIdentityKeyParams = {
    device: TrezorDeviceWithState;
};

const retrieveDelegatedIdentityKey = async ({
    device,
}: RetrieveDelegatedIdentityKeyParams): Promise<Result<DelegatedIdentityKey, RetrieveResult>> => {
    try {
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

        const canceled = isCanceledErrorMessage(result.payload.error);

        return err({
            message: result.payload.error,
            canceled,
        });
    } catch (e) {
        return err({
            message: String(e),
            canceled: false,
        });
    }
};

type RetrieveDelegatedIdentityKeyThunkParams = {
    device: TrezorDeviceWithState;
};

export const retrieveDelegatedIdentityKeyThunk = createThunk<
    Result<DelegatedIdentityKey, RetrieveResult>,
    RetrieveDelegatedIdentityKeyThunkParams,
    void
>(
    `${DEVICE_MODULE_PREFIX}/retrieveDelegatedIdentityKeyThunk`,
    async ({ device }, { dispatch, getState }) => {
        const persistedData = selectPersistentDeviceData(getState());
        const devicePersistedData = persistedData.find(it => it.device_id === device.id);
        const currentDelegatedKey = devicePersistedData?.delegatedIdentityKey ?? null;

        if (currentDelegatedKey === null) {
            const result = await retrieveDelegatedIdentityKey({ device });

            dispatch(
                deviceActions.setDelegatedIdentityKey({
                    deviceId: device.id,
                    delegatedKey: result.ok ? result.value : null,
                }),
            );

            return result;
        }

        return ok(currentDelegatedKey);
    },
);
