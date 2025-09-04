import { createThunk } from '@suite-common/redux-utils/';
import { isThpDevice } from '@suite-common/suite-utils';
import { thpActions } from '@suite-common/thp';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { THP_PREFIX } from './thpActions';

type RemoveThpAutoconnectThunkParams =
    | {
          credentials?: Parameters<typeof TrezorConnect.thpRemoveCredentials>[0]['credentials'];
      }
    | undefined;

type RemoveThpAutoconnectThunkResult =
    | ReturnType<typeof TrezorConnect.thpRemoveCredentials>
    | undefined;

export const removeThpAutoconnectThunk = createThunk<
    RemoveThpAutoconnectThunkResult,
    RemoveThpAutoconnectThunkParams,
    void
>(
    `${THP_PREFIX}/removeThpAutoconnectThunk`,
    async (
        params,
        { getState, dispatch, fulfillWithValue, rejectWithValue },
    ): Promise<RemoveThpAutoconnectThunkResult> => {
        const device = selectSelectedDevice(getState());

        if (device === undefined || !isThpDevice(device)) {
            return fulfillWithValue(undefined);
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
            rejectWithValue(response);
        }

        return fulfillWithValue(response);
    },
);
