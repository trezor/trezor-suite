import {
    State as TransactionsState,
    WalletAccountTransaction,
} from '@wallet-reducers/transactionReducer';
import { AccountTransaction } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import messages from '@suite/support/messages';
import { ACCOUNT_TYPE } from '@wallet-constants/account';
import { Account, Network, Fiat, WalletParams } from '@wallet-types';
import { AppState } from '@suite-types';
import { NETWORKS } from '@wallet-config';
import { toFiatCurrency } from './fiatConverterUtils';

export const parseBIP44Path = (path: string) => {
    const regEx = /m\/(\d+'?)\/(\d+'?)\/(\d+'?)\/([0,1])\/(\d+)/;
    const tokens = path.match(regEx);
    if (!tokens || tokens.length !== 6) {
        return null;
    }

    return {
        purpose: tokens[1],
        coinType: tokens[2],
        account: tokens[3],
        change: tokens[4],
        addrIndex: tokens[5],
    };
};

export const getFiatValue = (amount: string, rate: string, fixedTo = 2) => {
    const fiatValueBigNumber = new BigNumber(amount).multipliedBy(new BigNumber(rate));
    const fiatValue = fiatValueBigNumber.isNaN() ? '' : fiatValueBigNumber.toFixed(fixedTo);

    return fiatValue;
};

export const getTitleForNetwork = (symbol: Account['symbol']) => {
    switch (symbol.toLowerCase()) {
        case 'btc':
            return messages.TR_NETWORK_BITCOIN;
        case 'test':
            return messages.TR_NETWORK_BITCOIN_TESTNET;
        case 'bch':
            return messages.TR_NETWORK_BITCOIN_CASH;
        case 'btg':
            return messages.TR_NETWORK_BITCOIN_GOLD;
        case 'dash':
            return messages.TR_NETWORK_DASH;
        case 'dgb':
            return messages.TR_NETWORK_DIGIBYTE;
        case 'doge':
            return messages.TR_NETWORK_DOGECOIN;
        case 'ltc':
            return messages.TR_NETWORK_LITECOIN;
        case 'nmc':
            return messages.TR_NETWORK_NAMECOIN;
        case 'vtc':
            return messages.TR_NETWORK_VERTCOIN;
        case 'zec':
            return messages.TR_NETWORK_ZCASH;
        case 'eth':
            return messages.TR_NETWORK_ETHEREUM;
        case 'trop':
            return messages.TR_NETWORK_ETHEREUM_TESTNET;
        case 'etc':
            return messages.TR_NETWORK_ETHEREUM_CLASSIC;
        case 'xem':
            return messages.TR_NETWORK_NEM;
        case 'xlm':
            return messages.TR_NETWORK_STELLAR;
        case 'ada':
            return messages.TR_NETWORK_CARDANO;
        case 'xtz':
            return messages.TR_NETWORK_TEZOS;
        case 'xrp':
            return messages.TR_NETWORK_XRP;
        case 'txrp':
            return messages.TR_NETWORK_XRP_TESTNET;
        default:
            return messages.TR_NETWORK_UNKNOWN;
    }
};

// same as 'getTypeForNetwork' below except it returns proper value for NORMAL account type
export const getAccountTypeIntl = (accountType: Account['accountType']) => {
    switch (accountType) {
        case ACCOUNT_TYPE.NORMAL:
            return messages.TR_NETWORK_TYPE_NORMAL;
        case ACCOUNT_TYPE.SEGWIT:
            return messages.TR_NETWORK_TYPE_SEGWIT;
        case ACCOUNT_TYPE.LEGACY:
            return messages.TR_NETWORK_TYPE_LEGACY;
        // no default
    }
};

export const getTypeForNetwork = (accountType: Account['accountType']) => {
    switch (accountType) {
        case ACCOUNT_TYPE.NORMAL:
            return null;
        case ACCOUNT_TYPE.SEGWIT:
            return messages.TR_NETWORK_TYPE_SEGWIT;
        case ACCOUNT_TYPE.LEGACY:
            return messages.TR_NETWORK_TYPE_LEGACY;
        // no default
    }
};

export const getBip43Shortcut = (path: string) => {
    if (typeof path !== 'string') return 'unknown';
    // https://github.com/bitcoin/bips/blob/master/bip-0043.mediawiki
    const bip43 = path.split('/')[1];
    switch (bip43) {
        case `84'`:
            return 'bech32';
        case `49'`:
            return 'p2sh';
        case `44'`:
            return 'p2phk';
        default:
            return 'unknown';
    }
};

export const stripNetworkAmount = (amount: string, decimals: number) => {
    return new BigNumber(amount).toFixed(decimals, 1);
};

export const formatAmount = (amount: string, decimals: number) => {
    try {
        const bAmount = new BigNumber(amount);
        if (bAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }
        return bAmount.div(10 ** decimals).toString(10);
    } catch (error) {
        return '-1';
    }
};

export const networkAmountToSatoshi = (amount: string | null, symbol: Account['symbol']) => {
    const network = NETWORKS.find(n => n.symbol === symbol);
    if (!amount) return '0';
    if (!network) return amount;
    try {
        const bAmount = new BigNumber(amount);
        if (bAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }
        return bAmount.times(10 ** network.decimals).toString(10);
    } catch (error) {
        // TODO: return null, so we can decide how to handle missing value in caller component
        return '-1';
    }
};

export const formatNetworkAmount = (amount: string, symbol: Account['symbol']) => {
    const network = NETWORKS.find(n => n.symbol === symbol);
    if (!network) return amount;
    return formatAmount(amount, network.decimals);
};

export const sortByCoin = (accounts: Account[]) => {
    return accounts.sort((a, b) => {
        const aIndex = NETWORKS.findIndex(n => {
            const accountType = n.accountType || ACCOUNT_TYPE.NORMAL;
            return accountType === a.accountType && n.symbol === a.symbol;
        });
        const bIndex = NETWORKS.findIndex(n => {
            const accountType = n.accountType || ACCOUNT_TYPE.NORMAL;
            return accountType === b.accountType && n.symbol === b.symbol;
        });
        if (aIndex === bIndex) return a.index - b.index;
        return aIndex - bIndex;
    });
};

export const findAccountsByAddress = (address: string, accounts: Account[]) =>
    accounts.filter(a => {
        if (a.addresses) {
            return (
                a.addresses.used.find(u => u.address === address) ||
                a.addresses.unused.find(u => u.address === address) ||
                a.addresses.change.find(u => u.address === address) ||
                a.descriptor === address
            );
        }
        return a.descriptor === address;
    });

export const findAccountDevice = (account: Account, devices: AppState['devices']) =>
    devices.find(d => d.state === account.deviceState);

export const getAllAccounts = (deviceState: string | typeof undefined, accounts: Account[]) =>
    accounts.filter(a => a.deviceState === deviceState && a.visible);

export const getSelectedAccount = (
    deviceState: string | typeof undefined,
    accounts: Account[],
    routerParams: WalletParams | undefined,
) => {
    if (!deviceState || !routerParams) return null;

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
                a.deviceState === deviceState,
        ) || null
    );
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

export const countUniqueCoins = (accounts: Account[]) => {
    const coins = new Set();
    accounts.forEach(acc => coins.add(acc.symbol));
    return coins.size;
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

export const getAccountFiatBalance = (account: Account, localCurrency: string, fiat: Fiat[]) => {
    const fiatRates = fiat.find(f => f.symbol === account.symbol);
    if (fiatRates) {
        const fiatBalance = toFiatCurrency(account.balance, localCurrency, fiatRates);
        if (fiatBalance) {
            return formatNetworkAmount(fiatBalance, account.symbol);
        }
    }
};

export const getTotalFiatBalance = (
    deviceAccounts: Account[],
    localCurrency: string,
    fiat: Fiat[],
) => {
    let instanceBalance = new BigNumber(0);
    deviceAccounts.forEach(a => {
        const accountFiatBalance = getAccountFiatBalance(a, localCurrency, fiat) ?? '0';
        instanceBalance = instanceBalance.plus(accountFiatBalance);
    });
    return instanceBalance;
};

export const isTestnet = (symbol: Account['symbol']) => {
    const net = NETWORKS.find(n => n.symbol === symbol);
    return net?.testnet ?? false;
};
