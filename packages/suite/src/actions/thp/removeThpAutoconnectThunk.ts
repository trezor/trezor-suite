import { createThunk } from '@suite-common/redux-utils/';
import { thpActions } from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectSelectedDevice } from '@suite-common/wallet-core';
// TODO thp-post-fixes
// import TrezorConnect from '@trezor/connect';

import { THP_PREFIX } from './thpActions';

// TODO thp-post-fixes
type Fn = (args: { credentials: any[] }) => any; // typeof TrezorConnect.thpRemoveCredentials;

type RemoveThpAutoconnectThunkParams =
    | {
          credentials?: Parameters<Fn>[0]['credentials'];
      }
    | undefined;

type RemoveThpAutoconnectThunkResult = ReturnType<Fn> | undefined;

export const removeThpAutoconnectThunk = createThunk<
    RemoveThpAutoconnectThunkResult,
    RemoveThpAutoconnectThunkParams,
    void
>(
    `${THP_PREFIX}/removeThpAutoconnectThunk`,
    async (
        params,
        { getState, dispatch, fulfillWithValue },
    ): Promise<RemoveThpAutoconnectThunkResult> => {
        const device = selectSelectedDevice(getState());

        if (device === undefined || device.thp === undefined) {
            return fulfillWithValue(undefined);
        }

        const credentialsToRemove =
            params?.credentials !== undefined ? params?.credentials : device.thp.credentials;

        // TODO thp-post-fixes
        // const response = await TrezorConnect.thpRemoveCredentials({
        //     credentials: credentialsToRemove,
        // });
        const response: any = await Promise.resolve({
            success: false,
            payload: { error: 'Implement TrezorConnect.thpRemoveCredentials' },
        });

        if (response.success) {
            dispatch(thpActions.removeCredentials({ credentials: credentialsToRemove }));
        } else {
            dispatch(
                notificationsActions.addToast({ type: 'error', error: response.payload.error }),
            );
        }
        dispatch(thpActions.resetThpFlow());

        return fulfillWithValue(response);
    },
);
