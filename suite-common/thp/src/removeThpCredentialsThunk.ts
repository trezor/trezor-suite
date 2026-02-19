import { createThunk } from '@suite-common/redux-utils';
import type { TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';
import type { ThpCredentials } from '@trezor/protocol';

import { THP_PREFIX, thpActions } from './thpActions';

type RemoveThpCredentialsThunkParams = {
    device?: TrezorDevice;
    credentials?: ThpCredentials[];
};

export const removeThpCredentialsThunk = createThunk<void, RemoveThpCredentialsThunkParams, void>(
    `${THP_PREFIX}/removeThpCredentialsThunk`,
    async (params, { dispatch }) => {
        const { device } = params;
        const credentials = params.credentials || device?.thp?.credentials || [];
        if (credentials.length === 0) {
            return;
        }

        // NOTE: we don't care about the result (for example missing device) we tried our best
        await TrezorConnect.thpRemoveCredentials({
            device: device?.connected ? device : undefined,
            credentials,
        });

        dispatch(thpActions.removeCredentials({ credentials }));
    },
);
