import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { forgetDisconnectedDevices, selectDevices } from '@suite-common/wallet-core';

import * as storageActions from 'src/actions/suite/storageActions';

import { goto } from './routerActions';
import { setAutoEject } from './suiteActions';

const AUTO_EJECT_PREFIX = '@suite/autoEject';

export const setAutoEjectEnabledThunk = createThunk(
    `${AUTO_EJECT_PREFIX}/enableAutoEjectThunk`,
    (
        {
            enabled,
            disconnectedDevices,
        }: {
            enabled: boolean;
            disconnectedDevices: TrezorDevice[];
        },
        { dispatch, getState },
    ) => {
        if (!enabled) {
            dispatch(setAutoEject(false));

            return;
        }

        disconnectedDevices.forEach(device => {
            dispatch(forgetDisconnectedDevices({ device, forceForget: true }));
        });

        const allDevices = selectDevices(getState());
        allDevices.forEach(device => {
            if (device.features) {
                dispatch(storageActions.forgetDevice(device));
            }
        });

        dispatch(setAutoEject(true));

        const currentDevices = selectDevices(getState());
        const connectedDevices = currentDevices.filter(device => device.connected && device.state);

        if (connectedDevices.length === 0) {
            dispatch(goto('suite-index'));
        }
    },
);
