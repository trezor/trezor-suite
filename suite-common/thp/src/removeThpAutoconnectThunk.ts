import { createThunk } from '@suite-common/redux-utils/';
import { isThpDevice } from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect, { Unsuccessful } from '@trezor/connect';

import { THP_PREFIX, thpActions } from './thpActions';

type RemoveThpAutoconnectThunkParams =
    | {
          credentials?: Parameters<typeof TrezorConnect.thpRemoveCredentials>[0]['credentials'];
      }
    | undefined;

type RemoveThpAutoconnectThunkResult = ReturnType<typeof TrezorConnect.thpRemoveCredentials>;

export const removeThpAutoconnectThunk = createThunk<
    RemoveThpAutoconnectThunkResult,
    RemoveThpAutoconnectThunkParams,
    { rejectValue: Unsuccessful | 'invalid-device' }
>(
    `${THP_PREFIX}/removeThpAutoconnectThunk`,
    async (
        params,
        { getState, dispatch, fulfillWithValue, rejectWithValue },
    ): Promise<RemoveThpAutoconnectThunkResult | ReturnType<typeof rejectWithValue>> => {
        const device = selectSelectedDevice(getState());

        if (device === undefined || !isThpDevice(device)) {
            return rejectWithValue('invalid-device');
        }

        const credentialsToRemove =
            params?.credentials !== undefined ? params?.credentials : device.thp.credentials;

        const response = await TrezorConnect.thpRemoveCredentials({
            credentials: credentialsToRemove,
        });

        if (response.success) {
            dispatch(thpActions.removeCredentials({ credentials: credentialsToRemove }));
        }

        dispatch(thpActions.finishThpFlow());

        if (!response.success) {
            return rejectWithValue(response);
        }

        return fulfillWithValue(response);
    },
);
