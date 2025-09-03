import { createThunk } from '@suite-common/redux-utils';
import { forgetAllDisconnectedDevices, selectDevices } from '@suite-common/wallet-core';

import * as storageActions from 'src/actions/suite/storageActions';

import { goto } from './routerActions';
import { setAutoEject } from './suiteActions';

const AUTO_EJECT_PREFIX = '@suite/autoEject';

type SetAutoEjectEnabledThunkProps = { enabled: boolean };

export const setAutoEjectEnabledThunk = createThunk<void, SetAutoEjectEnabledThunkProps, void>(
    `${AUTO_EJECT_PREFIX}/enableAutoEjectThunk`,
    async ({ enabled }, { dispatch, getState }) => {
        if (!enabled) {
            dispatch(setAutoEject(false));

            return;
        }

        // Disconnected devices are purged from local redux (awaited because the subsequent code may rely on updated deviceReducer state)
        await dispatch(forgetAllDisconnectedDevices());

        // All devices, even connected ones, removed from persistent storage,
        // which means connected device are preserved in local redux.
        dispatch(storageActions.forgetAllDevicesThunk());

        dispatch(setAutoEject(true));

        const currentDevices = selectDevices(getState());
        const connectedDevices = currentDevices.filter(device => device.connected && device.state);

        if (connectedDevices.length === 0) {
            dispatch(goto('suite-index'));
        }
    },
);
