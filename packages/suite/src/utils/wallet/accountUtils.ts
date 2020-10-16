import {
    State as TransactionsState,
    WalletAccountTransaction,
} from '@wallet-reducers/transactionReducer';
import { AccountTransaction, AccountInfo } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import messages from '@suite/support/messages';
import { ACCOUNT_TYPE } from '@wallet-constants/account';
import { Account, Network, CoinFiatRates, WalletParams, Discovery } from '@wallet-types';
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
export const getAccountTypeIntl = (accountType: Network['accountType']) => {
    switch (accountType) {
        case ACCOUNT_TYPE.SEGWIT:
            return messages.TR_ACCOUNT_TYPE_SEGWIT;
        case ACCOUNT_TYPE.LEGACY:
            return messages.TR_ACCOUNT_TYPE_LEGACY;
        default:
            return messages.TR_ACCOUNT_TYPE_NORMAL;
    }
};

export const getTypeForNetwork = (accountType: Account['accountType']) => {
    switch (accountType) {
        case ACCOUNT_TYPE.NORMAL:
            return null;
        case ACCOUNT_TYPE.SEGWIT:
            return messages.TR_ACCOUNT_TYPE_SEGWIT;
        case ACCOUNT_TYPE.LEGACY:
            return messages.TR_ACCOUNT_TYPE_LEGACY;
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

export const getBip43Intl = (path: string) => {
    const bip43 = getBip43Shortcut(path);
    if (bip43 === 'bech32') return messages.TR_ACCOUNT_TYPE_BECH32;
    if (bip43 === 'p2sh') return messages.TR_ACCOUNT_TYPE_P2SH;
    return messages.TR_ACCOUNT_TYPE_P2PKH;
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

export const amountToSatoshi = (amount: string, decimals: number) => {
    try {
        const bAmount = new BigNumber(amount);
        if (bAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }
        return bAmount.times(10 ** decimals).toString(10);
    } catch (error) {
        // TODO: return null, so we can decide how to handle missing value in caller component
        return '-1';
    }
};

export const networkAmountToSatoshi = (amount: string | null, symbol: Account['symbol']) => {
    const network = NETWORKS.find(n => n.symbol === symbol);
    if (!amount) return '0';
    if (!network) return amount;
    return amountToSatoshi(amount, network.decimals);
};

export const formatNetworkAmount = (
    amount: string,
    symbol: Account['symbol'],
    withSymbol = false,
) => {
    const network = NETWORKS.find(n => n.symbol === symbol);
    if (!network) return amount;
    if (withSymbol) return `${formatAmount(amount, network.decimals)} ${symbol.toUpperCase()}`;
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

export const findAccountsByDescriptor = (descriptor: string, accounts: Account[]) =>
    accounts.filter(a => a.descriptor === descriptor);

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

export const getAllAccounts = (deviceState: string | typeof undefined, accounts: Account[]) => {
    if (!deviceState) return [];
    return accounts.filter(a => a.deviceState === deviceState && a.visible);
};

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

export const getNetwork = (symbol: string) => {
    return NETWORKS.find(c => c.symbol === symbol) || null;
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

/**
 * Clear invalid tokens and formats amounts
 *
 * @param {Account['tokens']} tokens
 * @returns {Account['tokens']}
 */
export const enhanceTokens = (tokens: Account['tokens']) => {
    if (!tokens) return [];
    return tokens
        .filter(t => t.symbol && t.balance && t.name)
        .map(t => ({
            ...t,
            symbol: t.symbol!.toLowerCase(),
            balance: formatAmount(t.balance!, t.decimals),
        }));
};

export const getAccountFiatBalance = (
    account: Account,
    localCurrency: string,
    fiat: CoinFiatRates[],
) => {
    const fiatRates = fiat.find(f => f.symbol === account.symbol);
    if (fiatRates) {
        const fiatBalance = toFiatCurrency(
            account.formattedBalance,
            localCurrency,
            fiatRates.current?.rates,
        );
        return fiatBalance;
    }
};

export const getTotalFiatBalance = (
    deviceAccounts: Account[],
    localCurrency: string,
    fiat: CoinFiatRates[],
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

export const isAccountOutdated = (account: Account, freshInfo: AccountInfo) => {
    // changed transaction count (total + unconfirmed)
    const changedTxCount =
        freshInfo.history.total + (freshInfo.history.unconfirmed || 0) >
        account.history.total + (account.history.unconfirmed || 0);

    // different sequence or balance
    const changedRipple =
        account.networkType === 'ripple' &&
        (freshInfo.misc!.sequence !== account.misc.sequence ||
            freshInfo.balance !== account.balance);

    const changedEthereum =
        account.networkType === 'ethereum' && freshInfo.misc!.nonce !== account.misc.nonce;

    return changedTxCount || changedRipple || changedEthereum;
};

// Used in accountActions and failed accounts
export const getAccountSpecific = (
    accountInfo: Partial<AccountInfo>,
    networkType: Network['networkType'],
) => {
    const { misc } = accountInfo;
    if (networkType === 'ripple') {
        return {
            networkType,
            misc: {
                sequence: misc && misc.sequence ? misc.sequence : 0,
                reserve: misc && misc.reserve ? misc.reserve : '0',
            },
            marker: accountInfo.marker,
            page: undefined,
        };
    }

    if (networkType === 'ethereum') {
        return {
            networkType,
            misc: {
                nonce: misc && misc.nonce ? misc.nonce : '0',
            },
            marker: undefined,
            page: accountInfo.page,
        };
    }

    return {
        networkType,
        misc: undefined,
        marker: undefined,
        page: accountInfo.page,
    };
};

// Used in wallet/Menu and Dashboard
export const getFailedAccounts = (discovery: Discovery): Account[] => {
    return discovery.failed.map(f => {
        const descriptor = `failed:${f.index}:${f.symbol}:${f.accountType}`;
        return {
            failed: true,
            deviceState: discovery.deviceState,
            index: f.index,
            path: descriptor,
            descriptor,
            key: descriptor,
            accountType: f.accountType,
            symbol: f.symbol,
            empty: false,
            visible: true,
            balance: '0',
            availableBalance: '0',
            formattedBalance: '0',
            tokens: [],
            addresses: undefined,
            utxo: undefined,
            history: {
                total: 0,
            },
            metadata: {
                key: descriptor,
                fileName: '',
                aesKey: '',
                outputLabels: {},
                addressLabels: {},
            },
            ...getAccountSpecific({}, getNetwork(f.symbol)!.networkType),
        };
    });
};

export const getAccountIdentifier = (account: Account) => {
    return {
        descriptor: account.descriptor,
        symbol: account.symbol,
        deviceState: account.deviceState,
    };
};

export const accountSearchFn = (
    account: Account,
    rawSearchString?: string,
    coinFilter?: Account['symbol'],
) => {
    // if coin filter is active and account symbol doesn't match return false and don't continue the search
    const coinFilterMatch = coinFilter ? account.symbol === coinFilter : true;
    if (!coinFilterMatch) return false;

    const searchString = rawSearchString?.trim().toLowerCase();
    if (!searchString) return true; // no search string

    // helper func for searching in account's addresses
    const matchAddressFn = (u: NonNullable<Account['addresses']>['used'][number]) =>
        u.address.toLowerCase() === searchString;

    const symbolMatch = account.symbol.startsWith(searchString);
    const networkNameMatch = getNetwork(account.symbol)?.name.toLowerCase().includes(searchString);
    const accountTypeMatch = account.accountType.startsWith(searchString);
    const descriptorMatch = account.descriptor.toLowerCase() === searchString;
    const addressMatch = account.addresses
        ? account.addresses.used.find(matchAddressFn) ||
          account.addresses.unused.find(matchAddressFn) ||
          account.addresses.change.find(matchAddressFn)
        : false;

    const metadataMatch = account.metadata.accountLabel?.toLowerCase().includes(searchString);

    return (
        symbolMatch ||
        networkNameMatch ||
        accountTypeMatch ||
        descriptorMatch ||
        addressMatch ||
        metadataMatch
    );
};
