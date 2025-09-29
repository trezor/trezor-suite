import { createThunk } from '@suite-common/redux-utils/';
import { TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';

import { finishThpAutoconnectThunk } from './finishThpAutoconnectThunk';
import { THP_PREFIX, thpActions } from './thpActions';

type StartThpAutoconnectThunkParam = {
    device: TrezorDevice;
};

export const startThpAutoconnectThunk = createThunk<void, StartThpAutoconnectThunkParam, void>(
    `${THP_PREFIX}/startThpAutoconnectThunk`,
    async ({ device }, { dispatch }) => {
        const response = await TrezorConnect.thpGetCredentials({ device });

        if (response.success) {
            dispatch(thpActions.addCredential({ credential: response.payload }));
        } else {
            dispatch(
                notificationsActions.addToast({ type: 'error', error: response.payload.error }),
            );
        }
        dispatch(finishThpAutoconnectThunk());
    },
);
