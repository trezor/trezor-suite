import BigNumber from 'bignumber.js';
import { AppState, TrezorDevice } from '@suite/types/suite';
import { Discovery } from '@suite/reducers/wallet/discoveryReducer';
import { Transaction, Account, Token, Network } from '@wallet-types';

export const getPendingAmount = (
    pending: Transaction[],
    currency: string,
    token: boolean = false,
): BigNumber =>
    pending.reduce((value: BigNumber, tx: Transaction): BigNumber => {
        if (tx.type !== 'send') return value;
        if (!token) {
            // regular transactions
            // add fees from token txs and amount from regular txs
            return new BigNumber(value).plus(tx.tokens ? tx.fee : tx.total);
        }
        if (tx.tokens) {
            // token transactions
            const allTokens = tx.tokens.filter(t => t.shortcut === currency);
            const tokensValue: BigNumber = allTokens.reduce(
                (_, t) => new BigNumber(value).plus(t.value),
                new BigNumber('0'),
            );
            return new BigNumber(value).plus(tokensValue);
        }
        // default
        return value;
    }, new BigNumber('0'));

export const getAccountTokens = (tokens: Token[], account?: Account) => {
    const a = account;
    if (!a) return [];
    return tokens.filter(
        t =>
            t.ethAddress === a.descriptor &&
            t.network === a.network &&
            t.deviceState === a.deviceState,
    );
};

export const observeChanges = (prev?: any, current?: any, filter?: { [k: string]: string[] }) => {
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

        // 8. observe every key recursive
        for (let i = 0; i < currentKeys.length; i++) {
            const key = currentKeys[i];
            // eslint-disable-next-line no-prototype-builtins
            if (filter && filter.hasOwnProperty(key) && prev[key] && current[key]) {
                const prevFiltered = {};
                const currentFiltered = {};
                for (let i2 = 0; i2 < filter[key].length; i2++) {
                    const field = filter[key][i2];
                    // @ts-ignore
                    prevFiltered[field] = prev[key][field];
                    // @ts-ignore
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

export const getSelectedAccount = (
    accounts: Account[],
    device: AppState['suite']['device'],
    routerParams: AppState['router']['params'],
) => {
    if (!device || !routerParams.coin || !routerParams.accountId) return null;

    // imported account index has 'i' prefix
    const isImported = /^i\d+$/i.test(routerParams.accountId);
    const index: number = isImported
        ? parseInt(routerParams.accountId.substr(1), 10)
        : parseInt(routerParams.accountId, 10);

    // TODO: filter deviceState;
    // return accounts.find(
    //     a =>
    //         a.imported === isImported &&
    //         (a.deviceState === device.state ||
    //             (a.imported && a.deviceID === (device.features || {}).device_id)) &&
    //         a.index === index &&
    //         a.network === routerParams.coin
    // ) || null;

    return accounts.find(a => a.index === index && a.network === routerParams.coin) || null;
};

export const getSelectedNetwork = (networks: Network[], symbol: string) => {
    return networks.find(c => c.symbol === symbol) || null;
};

export const getDiscoveryProcess = (
    discoveries: Discovery[],
    device?: TrezorDevice,
): Discovery | null => {
    if (!device || !device.features) return null;
    return discoveries.find(d => d.device === device.state) || null;
};
