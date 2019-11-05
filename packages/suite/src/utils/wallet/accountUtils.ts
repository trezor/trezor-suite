import {
    State as TransactionsState,
    WalletAccountTransaction,
} from '@wallet-reducers/transactionReducer';
import { AccountTransaction } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import l10nMessages from '@wallet-views/account/messages';
import { NETWORK_TYPE, ACCOUNT_TYPE } from '@wallet-constants/account';
import { Account, Network } from '@wallet-types';
import { AppState } from '@suite-types';
import { NETWORKS } from '@wallet-config';

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
            return l10nMessages.TR_NETWORK_BITCOIN;
        case 'test':
            return l10nMessages.TR_NETWORK_BITCOIN_TESTNET;
        case 'bch':
            return l10nMessages.TR_NETWORK_BITCOIN_CASH;
        case 'btg':
            return l10nMessages.TR_NETWORK_BITCOIN_GOLD;
        case 'dash':
            return l10nMessages.TR_NETWORK_DASH;
        case 'dgb':
            return l10nMessages.TR_NETWORK_DIGIBYTE;
        case 'doge':
            return l10nMessages.TR_NETWORK_DOGECOIN;
        case 'ltc':
            return l10nMessages.TR_NETWORK_LITECOIN;
        case 'nmc':
            return l10nMessages.TR_NETWORK_NAMECOIN;
        case 'vtc':
            return l10nMessages.TR_NETWORK_VERTCOIN;
        case 'zec':
            return l10nMessages.TR_NETWORK_ZCASH;
        case 'eth':
            return l10nMessages.TR_NETWORK_ETHEREUM;
        case 'trop':
            return l10nMessages.TR_NETWORK_ETHEREUM_TESTNET;
        case 'etc':
            return l10nMessages.TR_NETWORK_ETHEREUM_CLASSIC;
        case 'xem':
            return l10nMessages.TR_NETWORK_NEM;
        case 'xlm':
            return l10nMessages.TR_NETWORK_STELLAR;
        case 'ada':
            return l10nMessages.TR_NETWORK_CARDANO;
        case 'xtz':
            return l10nMessages.TR_NETWORK_TEZOS;
        case 'xrp':
            return l10nMessages.TR_NETWORK_XRP;
        case 'txrp':
            return l10nMessages.TR_NETWORK_XRP_TESTNET;
        default:
            return l10nMessages.TR_NETWORK_UNKNOWN;
    }
};

export const getTypeForNetwork = (accountType: Account['accountType']) => {
    switch (accountType) {
        case ACCOUNT_TYPE.NORMAL:
            return null;
        case ACCOUNT_TYPE.SEGWIT:
            return l10nMessages.TR_NETWORK_TYPE_SEGWIT;
        case ACCOUNT_TYPE.LEGACY:
            return l10nMessages.TR_NETWORK_TYPE_LEGACY;
        // no default
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

export const isAddressInAccount = (
    networkType: Network['networkType'],
    address: string,
    accounts: Account[],
) => {
    const filteredAccounts = accounts.filter(account => account.networkType === networkType);

    switch (networkType) {
        case NETWORK_TYPE.BITCOIN: {
            return filteredAccounts.find(account => {
                const { addresses } = account;
                if (addresses) {
                    const foundAccountUnused = addresses.unused.find(
                        item => item.address === address,
                    );
                    if (foundAccountUnused) {
                        return account;
                    }
                    const foundAccountUsed = addresses.used.find(item => item.address === address);
                    if (foundAccountUsed) {
                        return account;
                    }
                }
                return false;
            });
        }

        case NETWORK_TYPE.RIPPLE:
        case NETWORK_TYPE.ETHEREUM: {
            const foundAccount = filteredAccounts.find(account => account.descriptor === address);
            if (foundAccount) {
                return foundAccount;
            }
            return false;
        }
        // no default
    }
};

export const getAccountDevice = (devices: AppState['devices'], account: Account) => {
    const device = devices.find(d => d.state === account.deviceState);
    return device;
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
