import { createThunk } from '@suite-common/redux-utils/';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { finishThpAutoconnectThunk } from './finishThpAutoconnectThunk';
import { THP_PREFIX, thpActions } from './thpActions';

export const startThpAutoconnectThunk = createThunk(
    `${THP_PREFIX}/startThpAutoconnectThunk`,
    async (_, { getState, dispatch, rejectWithValue, fulfillWithValue }) => {
        const device = selectSelectedDevice(getState());

        if (device === undefined) {
            dispatch(thpActions.cancelThpFlow());

            return rejectWithValue('invalid-device');
        }

        const response = await TrezorConnect.thpGetCredentials({ device });

        if (response.success) {
            dispatch(thpActions.addCredential({ credential: response.payload }));
            dispatch(finishThpAutoconnectThunk());
            fulfillWithValue(response);
        } else {
            dispatch(
                notificationsActions.addToast({ type: 'error', error: response.payload.error }),
            );

            dispatch(thpActions.cancelThpFlow());

            return rejectWithValue(response);
        }
    },
);
