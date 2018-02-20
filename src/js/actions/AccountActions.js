/* @flow */
'use strict';

import * as ACCOUNT from './constants/account';

import { initialState } from '../reducers/AccountDetailReducer';
import { findSelectedDevice } from '../reducers/TrezorConnectReducer';

import type { State } from '../reducers/AccountDetailReducer';
import type { Discovery } from '../reducers/DiscoveryReducer';

export const init = (): any => {
    return (dispatch, getState): void => {

        const { location } = getState().router;
        const urlParams = location.params;

        const selected = findSelectedDevice( getState().connect );
        if (!selected) return;


        const state: State = {
            index: parseInt(urlParams.address),
            checksum: selected.checksum,
            coin: urlParams.coin,
            location: location.pathname
        };

        dispatch({
            type: ACCOUNT.INIT,
            state: state
        });


        // let discoveryProcess: ?Discovery = getState().discovery.find(d => d.checksum === selected.checksum && d.coin === currentAccount.coin);
        // const discovering: boolean = (!discoveryProcess || !discoveryProcess.completed);

        // const state: State = {
        //     ...initialState,
        //     loaded: true,
        //     checksum: currentAccount.checksum,
        //     address: currentAccount.address,
        //     coin: urlParams.coin,
        //     balance: currentAccount.balance,

        //     discovering
        // };

        // dispatch({
        //     type: ACCOUNT.INIT,
        //     state
        // });
    }
}

export const update = (newProps: any): any => {
    return (dispatch, getState): void => {

        const {
            accountDetail,
            connect,
            discovery,
            accounts,
            router
        } = getState();

        const isLocationChanged: boolean = newProps.location.pathname !== accountDetail.location;
        
        if (isLocationChanged) {
            dispatch({
                type: ACCOUNT.INIT,
                state: {
                    ...accountDetail,
                    location: newProps.location.pathname,
                }
            });
            return;
        }

        // update comes from device
        // const device = connect.devices.find(d => d.checksum === accountDetail.checksum);
        // if (accountDetail.detail !== device) {
        //     console.warn("DEV UPDATE!!!!")
        // }

        // const discoveryProcess = discovery.find(d => d.checksum === device.checksum && d.coin === accountDetail.coin);

        // const account = accounts.find(a => a.checksum === accountDetail.checksum && a.index === accountDetail.addressIndex && a.coin === accountDetail.coin);
        // if (account && !accountDetail.address) {
        //     // update current address
        //     console.warn("ACC UPDATE!!!!")
        // }


        // isDeviceChanged
        // isDiscoveryChanged
    }
}

export const dispose = (device: any): any => {
    return (dispatch, getState): void => {
        dispatch({
            type: ACCOUNT.DISPOSE,
        });
    }
}