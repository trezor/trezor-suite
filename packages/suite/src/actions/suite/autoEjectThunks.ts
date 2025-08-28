import { createThunk } from '@suite-common/redux-utils';
import { forgetDisconnectedDevices, selectDevices } from '@suite-common/wallet-core';

import * as storageActions from 'src/actions/suite/storageActions';

import { goto } from './routerActions';
import { setAutoEject } from './suiteActions';

const AUTO_EJECT_PREFIX = '@suite/autoEject';

type SetAutoEjectEnabledThunkProps = { enabled: boolean };

export const setAutoEjectEnabledThunk = createThunk<void, SetAutoEjectEnabledThunkProps, void>(
    `${AUTO_EJECT_PREFIX}/enableAutoEjectThunk`,
    ({ enabled }, { dispatch, getState }) => {
        if (!enabled) {
            dispatch(setAutoEject(false));

            return;
        }

        const devices = selectDevices(getState());

        const disconnectedDevices = devices.filter(device => !device.connected && device.state);

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
