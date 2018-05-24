/* @flow */
'use strict';

import * as LogActions from '~/js/actions/LogActions';
import * as STORAGE from '~/js/actions/constants/localStorage';
import * as WALLET from '~/js/actions/constants/wallet';

import type { 
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    State,
    Dispatch,
    Action,
    AsyncAction,
    GetState,
    TrezorDevice,
    Account,
    Coin,
    Discovery,
    Token,
    Web3Instance
} from '~/flowtype';

export const getSelectedDevice = (state: State): ?TrezorDevice => {

    const locationState = state.router.location.state;
    if (!locationState.device) return undefined;

    const instance: ?number = locationState.deviceInstance ? parseInt(locationState.deviceInstance) : undefined;
    return state.devices.find(d => {
        if (d.unacquired && d.path === locationState.device) {
            return true;
        } else if (d.features && d.features.bootloader_mode && d.path === locationState.device) {
            return true;
        } else if (d.features && d.features.device_id === locationState.device && d.instance === instance) {
            return true;
        }
        return false;
    });
}

export const isSelectedDevice = (current: ?TrezorDevice, device: ?TrezorDevice): boolean => {
    return (current && device && (current.path === device.path || current.instance === device.instance)) ? true : false;
}

export const getSelectedAccount = (state: State): ?Account => {
    const device = state.wallet.selectedDevice;
    const locationState = state.router.location.state;
    if (!device || !locationState.network || !locationState.account) return null;
    
    const index: number = parseInt(locationState.account);

    return state.accounts.find(a => a.deviceState === device.state && a.index === index && a.network === locationState.network);
}

export const getSelectedNetwork = (state: State): ?Coin => {
    const device = state.wallet.selectedDevice;
    const coins = state.localStorage.config.coins;
    const locationState = state.router.location.state;
    if (!device || !locationState.network) return null;
    
    return coins.find(c => c.network === locationState.network);
}

export const getDiscoveryProcess = (state: State): ?Discovery => {
    const device = state.wallet.selectedDevice;
    const locationState = state.router.location.state;
    if (!device || !locationState.network) return null;

    return state.discovery.find(d => d.deviceState === device.state && d.network === locationState.network);
}

export const getTokens = (state: State): Array<Token> => {
    const account = state.selectedAccount.account;
    if (!account) return state.selectedAccount.tokens;
    return state.tokens.filter(t => t.ethAddress === account.address && t.network === account.network && t.deviceState === account.deviceState);
}

export const getWeb3 = (state: State): ?Web3Instance => {
    const locationState = state.router.location.state;
    if (!locationState.network) return null;
    return state.web3.find(w3 => w3.network === locationState.network);
}