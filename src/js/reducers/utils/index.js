/* @flow */


import * as LogActions from '~/js/actions/LogActions';
import * as STORAGE from '~/js/actions/constants/localStorage';
import * as WALLET from '~/js/actions/constants/wallet';
import BigNumber from 'bignumber.js';

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
    PendingTx,
    Web3Instance,
} from '~/flowtype';

export const getSelectedDevice = (state: State): ?TrezorDevice => {
    const locationState = state.router.location.state;
    if (!locationState.device) return undefined;

    const instance: ?number = locationState.deviceInstance ? parseInt(locationState.deviceInstance) : undefined;
    return state.devices.find((d) => {
        if (d.unacquired && d.path === locationState.device) {
            return true;
        } if (d.features && d.features.bootloader_mode && d.path === locationState.device) {
            return true;
        } if (d.features && d.features.device_id === locationState.device && d.instance === instance) {
            return true;
        }
        return false;
    });
};

//
export const isSelectedDevice = (current: ?TrezorDevice, device: ?TrezorDevice): boolean => !!((current && device && (current.path === device.path && current.instance === device.instance)));

// find device by id and state
export const findDevice = (devices: Array<TrezorDevice>, deviceId: string, deviceState: string, instance: ?number): ?TrezorDevice => devices.find((d) => {
    // TODO: && (instance && d.instance === instance)
    if (d.features && d.features.device_id === deviceId && d.state === deviceState) {
        return true;
    }
    return false;
});

export const getSelectedAccount = (state: State): ?Account => {
    const device = state.wallet.selectedDevice;
    const locationState = state.router.location.state;
    if (!device || !locationState.network || !locationState.account) return null;

    const index: number = parseInt(locationState.account);

    return state.accounts.find(a => a.deviceState === device.state && a.index === index && a.network === locationState.network);
};

export const getSelectedNetwork = (state: State): ?Coin => {
    const device = state.wallet.selectedDevice;
    const coins = state.localStorage.config.coins;
    const locationState = state.router.location.state;
    if (!device || !locationState.network) return null;

    return coins.find(c => c.network === locationState.network);
};

export const getDiscoveryProcess = (state: State): ?Discovery => {
    const device = state.wallet.selectedDevice;
    const locationState = state.router.location.state;
    if (!device || !locationState.network) return null;

    return state.discovery.find(d => d.deviceState === device.state && d.network === locationState.network);
};

export const getAccountPendingTx = (pending: Array<PendingTx>, account: ?Account): Array<PendingTx> => {
    const a = account;
    if (!a) return [];
    return pending.filter(p => p.network === a.network && p.address === a.address);
};

export const getPendingNonce = (pending: Array<PendingTx>): number => pending.reduce((value: number, tx: PendingTx) => {
    if (tx.rejected) return value;
    return Math.max(value, tx.nonce + 1);
}, 0);

export const getPendingAmount = (pending: Array<PendingTx>, currency: string, token: boolean = false): BigNumber => pending.reduce((value: BigNumber, tx: PendingTx) => {
    if (tx.currency === currency && !tx.rejected) {
        return new BigNumber(value).plus(token ? tx.amount : tx.total);
    }
    return value;
}, new BigNumber('0'));

export const getAccountTokens = (state: State, account: ?Account): Array<Token> => {
    const a = account;
    if (!a) return [];
    return state.tokens.filter(t => t.ethAddress === a.address && t.network === a.network && t.deviceState === a.deviceState);
};

export const getWeb3 = (state: State): ?Web3Instance => {
    const locationState = state.router.location.state;
    if (!locationState.network) return null;
    return state.web3.find(w3 => w3.network === locationState.network);
};
