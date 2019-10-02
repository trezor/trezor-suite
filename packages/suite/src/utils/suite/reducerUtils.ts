import {
    State as TransactionsState,
    WalletAccountTransaction,
} from '@wallet-reducers/transactionReducer';
import { formatAmount, formatNetworkAmount } from '@wallet-utils/accountUtils';
import { AccountTransaction } from 'trezor-connect';
import { AppState } from '@suite-types';
import { Account, Network } from '@wallet-types';

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
    if (!device || !routerParams) return null;

    // TODO: imported accounts
    // imported account index has 'i' prefix
    // const isImported = /^i\d+$/i.test(routerParams.accountIndex);
    // const index: number = isImported
    //     ? parseInt(routerParams.accountIndex.substr(1), 10)
    //     : parseInt(routerParams.accountIndex, 10);

    return (
        accounts.find(
            a =>
                a.index === routerParams.accountIndex &&
                a.symbol === routerParams.symbol &&
                a.accountType === routerParams.accountType &&
                a.deviceState === device.state,
        ) || null
    );
};

export const getAccountDevice = (devices: AppState['devices'], account: Account) => {
    const device = devices.find(d => d.state === account.deviceState);
    return device;
};

export const getSelectedNetwork = (networks: Network[], symbol: string) => {
    return networks.find(c => c.symbol === symbol) || null;
};

/**
 * Returns a string used as an index to separate txs for given account inside a transactions reducer
 *
 * @param {string} descriptor
 * @param {string} symbol
 * @param {string} deviceState
 * @returns {string}
 */
export const getAccountKey = (descriptor: string, symbol: string, deviceState: string) => {
    return `${descriptor}-${symbol}-${deviceState}`;
};

export const getAccountTransactions = (
    transactions: TransactionsState['transactions'],
    account: Account,
) => {
    const accountHash = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    return transactions[accountHash] || [];
};

/**
 * Formats amounts and attaches fields from the account (descriptor, deviceState, symbol) to the tx object
 *
 * @param {AccountTransaction} tx
 * @param {Account} account
 * @returns {WalletAccountTransaction}
 */
export const enhanceTransaction = (
    tx: AccountTransaction,
    account: Account,
): WalletAccountTransaction => {
    return {
        descriptor: account.descriptor,
        deviceState: account.deviceState,
        symbol: account.symbol,
        ...tx,
        // https://bitcoin.stackexchange.com/questions/23061/ripple-ledger-time-format/23065#23065
        blockTime:
            account.networkType === 'ripple' && tx.blockTime
                ? tx.blockTime + 946684800
                : tx.blockTime,
        tokens: tx.tokens.map(tok => {
            return {
                ...tok,
                amount: formatAmount(tok.amount, tok.decimals),
            };
        }),
        amount: formatNetworkAmount(tx.amount, account.symbol),
        fee: formatNetworkAmount(tx.fee, account.symbol),
        targets: tx.targets.map(tr => {
            if (typeof tr.amount === 'string') {
                return {
                    ...tr,
                    amount: formatNetworkAmount(tr.amount, account.symbol),
                };
            }
            return tr;
        }),
    };
};
