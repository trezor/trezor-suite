/* @flow */
import BigNumber from 'bignumber.js';

import type {
    State,
    Device,
    TrezorDevice,
    Account,
    Coin,
    Discovery,
    Token,
    PendingTx,
    Web3Instance,
} from 'flowtype';

export const getSelectedDevice = (state: State): ?TrezorDevice => {
    const locationState = state.router.location.state;
    if (!locationState.device) return undefined;

    const instance: ?number = locationState.deviceInstance ? parseInt(locationState.deviceInstance, 10) : undefined;
    return state.devices.find((d) => {
        if (!d.features && d.path === locationState.device) {
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
export const findDevice = (devices: Array<TrezorDevice>, deviceId: string, deviceState: string /*, instance: ?number*/): ?TrezorDevice => devices.find((d) => {
    // TODO: && (instance && d.instance === instance)
    if (d.features && d.features.device_id === deviceId && d.state === deviceState) {
        return true;
    }
    return false;
});

// get next instance number
export const getDuplicateInstanceNumber = (devices: Array<TrezorDevice>, device: Device | TrezorDevice): number => {
    // find device(s) with the same features.device_id
    // and sort them by instance number
    const affectedDevices: Array<TrezorDevice> = devices.filter(d => d.features && device.features && d.features.device_id === device.features.device_id)
        .sort((a, b) => {
            if (!a.instance) {
                return -1;
            }
            return !b.instance || a.instance > b.instance ? 1 : -1;
        });

    // calculate new instance number
    const instance: number = affectedDevices.reduce((inst, dev) => (dev.instance ? dev.instance + 1 : inst + 1), 0);
    return instance;
};

export const getSelectedAccount = (state: State): ?Account => {
    const device = state.wallet.selectedDevice;
    const locationState = state.router.location.state;
    if (!device || !locationState.network || !locationState.account) return null;

    const index: number = parseInt(locationState.account, 10);

    return state.accounts.find(a => a.deviceState === device.state && a.index === index && a.network === locationState.network);
};

export const getSelectedNetwork = (state: State): ?Coin => {
    const device = state.wallet.selectedDevice;
    const { coins } = state.localStorage.config;
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

export const observeChanges = (prev: ?Object, current: ?Object, filter?: {[k: string]: Array<string>}): boolean => {
    // 1. both objects are the same (solves simple types like string, boolean and number)
    if (prev === current) return false;
    // 2. one of the objects is null/undefined
    if (!prev || !current) return true;

    const prevType = Object.prototype.toString.call(prev);
    const currentType = Object.prototype.toString.call(current);
    // 3. one of the objects has different type then other
    if (prevType !== currentType) return true;

    if (currentType === '[object Array]') {
        // 4. Array length is different
        if (prev.length !== current.length) return true;
        // observe array recursive
        for (let i = 0; i < current.length; i++) {
            if (observeChanges(prev[i], current[i], filter)) return true;
        }
    } else if (currentType === '[object Object]') {
        const prevKeys = Object.keys(prev);
        const currentKeys = Object.keys(current);
        // 5. simple validation of keys length
        if (prevKeys.length !== currentKeys.length) return true;

        // 6. "prev" has keys which "current" doesn't have
        const prevDifference = prevKeys.find(k => currentKeys.indexOf(k) < 0);
        if (prevDifference) return true;

        // 7. "current" has keys which "prev" doesn't have
        const currentDifference = currentKeys.find(k => prevKeys.indexOf(k) < 0);
        if (currentDifference) return true;

        // 8. observe every key recursive
        for (let i = 0; i < currentKeys.length; i++) {
            const key = currentKeys[i];
            if (filter && filter.hasOwnProperty(key) && prev[key] && current[key]) {
                const prevFiltered = {};
                const currentFiltered = {};
                for (let i2 = 0; i2 < filter[key].length; i2++) {
                    const field = filter[key][i2];
                    prevFiltered[field] = prev[key][field];
                    currentFiltered[field] = current[key][field];
                }
                if (observeChanges(prevFiltered, currentFiltered)) return true;
            } else if (observeChanges(prev[key], current[key])) {
                return true;
            }
        }
    } else if (prev !== current) {
        // solve simple types like string, boolean and number
        return true;
    }

    return false;
};
