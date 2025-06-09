import { createThunk } from '@suite-common/redux-utils/';
import { thpActions } from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { THP_PREFIX } from './thpActions';

export const startThpAutoconnectThunk = createThunk<void, void, void>(
    `${THP_PREFIX}/startThpAutoconnectThunk`,
    async (_, { getState, dispatch }) => {
        const device = selectSelectedDevice(getState());

        if (device === undefined) {
            return;
        }

        const response = await TrezorConnect.thpGetCredentials({ device });

        if (response.success) {
            dispatch(thpActions.addCredential({ credential: response.payload }));
        } else {
            dispatch(
                notificationsActions.addToast({ type: 'error', error: response.payload.error }),
            );
        }
        dispatch(thpActions.resetThpFlow());
    },
);
