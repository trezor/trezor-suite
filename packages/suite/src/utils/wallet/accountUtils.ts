import { State as TransactionsState } from '@wallet-reducers/transactionReducer';
import { AccountInfo, AccountAddress, PrecomposedTransaction } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import { ACCOUNT_TYPE } from '@wallet-constants/account';
import { Account, Network, CoinFiatRates, WalletParams, Discovery } from '@wallet-types';
import { PrecomposedTransactionFinal } from '@wallet-types/sendForm';
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
            return 'TR_NETWORK_BITCOIN';
        case 'test':
            return 'TR_NETWORK_BITCOIN_TESTNET';
        case 'bch':
            return 'TR_NETWORK_BITCOIN_CASH';
        case 'btg':
            return 'TR_NETWORK_BITCOIN_GOLD';
        case 'dash':
            return 'TR_NETWORK_DASH';
        case 'dgb':
            return 'TR_NETWORK_DIGIBYTE';
        case 'doge':
            return 'TR_NETWORK_DOGECOIN';
        case 'ltc':
            return 'TR_NETWORK_LITECOIN';
        case 'nmc':
            return 'TR_NETWORK_NAMECOIN';
        case 'vtc':
            return 'TR_NETWORK_VERTCOIN';
        case 'zec':
            return 'TR_NETWORK_ZCASH';
        case 'eth':
            return 'TR_NETWORK_ETHEREUM';
        case 'trop':
            return 'TR_NETWORK_ETHEREUM_TESTNET';
        case 'etc':
            return 'TR_NETWORK_ETHEREUM_CLASSIC';
        case 'xem':
            return 'TR_NETWORK_NEM';
        case 'xlm':
            return 'TR_NETWORK_STELLAR';
        case 'ada':
            return 'TR_NETWORK_CARDANO';
        case 'xtz':
            return 'TR_NETWORK_TEZOS';
        case 'xrp':
            return 'TR_NETWORK_XRP';
        case 'txrp':
            return 'TR_NETWORK_XRP_TESTNET';
        default:
            return 'TR_NETWORK_UNKNOWN';
    }
};

export const getBip43Type = (path: string) => {
    if (typeof path !== 'string') return 'unknown';
    // https://github.com/bitcoin/bips/blob/master/bip-0043.mediawiki
    const bip43 = path.split('/')[1];
    switch (bip43) {
        case `86'`:
            return 'bip86';
        case `84'`:
            return 'bip84';
        case `49'`:
            return 'bip49';
        case `44'`:
            return 'bip44';
        default:
            return 'unknown';
    }
};

export const getAccountTypeName = (path: string) => {
    const bip43 = getBip43Type(path);
    if (bip43 === 'bip86') return 'TR_ACCOUNT_TYPE_BIP86_NAME';
    if (bip43 === 'bip84') return 'TR_ACCOUNT_TYPE_BIP84_NAME';
    if (bip43 === 'bip49') return 'TR_ACCOUNT_TYPE_BIP49_NAME';
    return 'TR_ACCOUNT_TYPE_BIP44_NAME';
};

export const getAccountTypeTech = (path: string) => {
    const bip43 = getBip43Type(path);
    if (bip43 === 'bip86') return 'TR_ACCOUNT_TYPE_BIP86_TECH';
    if (bip43 === 'bip84') return 'TR_ACCOUNT_TYPE_BIP84_TECH';
    if (bip43 === 'bip49') return 'TR_ACCOUNT_TYPE_BIP49_TECH';
    return 'TR_ACCOUNT_TYPE_BIP44_TECH';
};

export const getAccountTypeDesc = (path: string) => {
    const bip43 = getBip43Type(path);
    if (bip43 === 'bip86') return 'TR_ACCOUNT_TYPE_BIP86_DESC';
    if (bip43 === 'bip84') return 'TR_ACCOUNT_TYPE_BIP84_DESC';
    if (bip43 === 'bip49') return 'TR_ACCOUNT_TYPE_BIP49_DESC';
    return 'TR_ACCOUNT_TYPE_BIP44_DESC';
};

export const getAccountTypeUrl = (path: string) => {
    const bip43 = getBip43Type(path);
    if (bip43 === 'bip86') return 'WIKI_ACCOUNT_BIP88_URL';
    if (bip43 === 'bip84') return 'WIKI_ACCOUNT_BIP84_URL';
    if (bip43 === 'bip49') return 'WIKI_ACCOUNT_BIP49_URL';
    return 'WIKI_ACCOUNT_BIP44_URL';
};

export const stripNetworkAmount = (amount: string, decimals: number) =>
    new BigNumber(amount).toFixed(decimals, 1);

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

export const sortByCoin = (accounts: Account[]) =>
    accounts.sort((a, b) => {
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

export const getNetwork = (symbol: string) => NETWORKS.find(c => c.symbol === symbol) || null;

/**
 * Returns a string used as an index to separate txs for given account inside a transactions reducer
 *
 * @param {string} descriptor
 * @param {string} symbol
 * @param {string} deviceState
 * @returns {string}
 */
export const getAccountKey = (descriptor: string, symbol: string, deviceState: string) =>
    `${descriptor}-${symbol}-${deviceState}`;

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
    const coinFiatRates = fiat.find(f => f.symbol === account.symbol);
    if (!coinFiatRates) return null;

    let totalBalance = new BigNumber(0);

    // account fiat balance
    const balance = toFiatCurrency(
        account.formattedBalance,
        localCurrency,
        coinFiatRates.current?.rates,
    );

    // sum fiat value of all tokens
    account.tokens?.forEach(t => {
        const tokenRates = fiat.find(
            f => f.mainNetworkSymbol === account.symbol && f.tokenAddress === t.address,
        );
        if (tokenRates && t.balance) {
            const tokenBalance = toFiatCurrency(
                t.balance,
                localCurrency,
                tokenRates.current?.rates,
            );
            if (tokenBalance) {
                totalBalance = totalBalance.plus(tokenBalance);
            }
        }
    });

    totalBalance = totalBalance.plus(balance ?? 0);
    return totalBalance.toFixed();
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
    // changed transaction count when app is running during tx confirmation
    const changedTxCountOnline =
        freshInfo.history.total + (freshInfo.history.unconfirmed || 0) >
        account.history.total + (account.history.unconfirmed || 0);

    // changed transaction count when app was closed before tx confirmation
    const changedTxCountOffline =
        freshInfo.history.total > account.history.total &&
        (freshInfo.history.unconfirmed || 0) < (account.history.unconfirmed || 0);

    // changed transaction count when app was closed during tx confirmation and account was empty
    const changedTxCountOfflineFresh =
        freshInfo.history.total === 0 && freshInfo.history.unconfirmed;

    // different sequence or balance
    const changedRipple =
        account.networkType === 'ripple' &&
        (freshInfo.misc!.sequence !== account.misc.sequence ||
            freshInfo.balance !== account.balance ||
            freshInfo.misc!.reserve !== account.misc.reserve);

    const changedEthereum =
        account.networkType === 'ethereum' && freshInfo.misc!.nonce !== account.misc.nonce;

    return (
        changedTxCountOfflineFresh ||
        changedTxCountOffline ||
        changedTxCountOnline ||
        changedRipple ||
        changedEthereum
    );
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
export const getFailedAccounts = (discovery: Discovery): Account[] =>
    discovery.failed.map(f => {
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

export const getAccountIdentifier = (account: Account) => ({
    descriptor: account.descriptor,
    symbol: account.symbol,
    deviceState: account.deviceState,
});

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

    const network = getNetwork(account.symbol);

    // helper func for searching in account's addresses
    const matchAddressFn = (u: NonNullable<Account['addresses']>['used'][number]) =>
        u.address.toLowerCase() === searchString;

    const symbolMatch = account.symbol.startsWith(searchString);
    const networkNameMatch = network?.name.toLowerCase().includes(searchString);
    const accountTypeMatch = account.accountType.startsWith(searchString);
    const descriptorMatch = account.descriptor.toLowerCase() === searchString;
    const addressMatch = account.addresses
        ? account.addresses.used.find(matchAddressFn) ||
          account.addresses.unused.find(matchAddressFn) ||
          account.addresses.change.find(matchAddressFn)
        : false;
    // find XRP accounts when users types in 'ripple'
    const matchXRPAlternativeName =
        network?.networkType === 'ripple' && 'ripple'.includes(searchString);

    const metadataMatch = account.metadata.accountLabel?.toLowerCase().includes(searchString);

    return (
        symbolMatch ||
        networkNameMatch ||
        accountTypeMatch ||
        descriptorMatch ||
        addressMatch ||
        matchXRPAlternativeName ||
        metadataMatch
    );
};

export const getUtxoFromSignedTransaction = (
    account: Account,
    tx: PrecomposedTransaction,
    txid: string,
    prevTxid?: string,
) => {
    if (tx.type !== 'final') return [];

    // find utxo to replace
    const replaceUtxo = (prevTxid && account.utxo?.filter(u => u.txid === prevTxid)) || [];

    // remove utxo used by signed transaction or replaced by new tx (rbf)
    const utxo =
        account.utxo?.filter(
            u =>
                !tx.transaction.inputs.find(
                    i => i.prev_hash === u.txid && i.prev_index === u.vout,
                ) && u.txid !== prevTxid,
        ) || [];

    // join all account addresses
    const addresses = account.addresses
        ? account.addresses.unused.concat(account.addresses.used).concat(account.addresses.change)
        : [];

    // append utxo created by this transaction
    tx.transaction.outputs.forEach((output, vout) => {
        let addr: AccountAddress | undefined;
        if (output.address_n) {
            // find change address
            const serialized = output.address_n.slice(3, 5).join('/');
            addr = account.addresses?.change.find(a => a.path.endsWith(serialized));
        }
        if (output.address) {
            // find self address
            addr = addresses.find(a => a.address === output.address);
        }

        // check if utxo should be added
        // may be spent already in case of rbf
        const utxoSpent =
            prevTxid && !replaceUtxo.find(u => u.address === addr?.address && u.vout === vout);

        if (addr && !utxoSpent) {
            utxo.unshift({
                vout,
                path: addr.path,
                address: addr.address,
                amount: output.amount,
                blockHeight: 0,
                confirmations: 0,
                txid,
            });
        }
    });

    return utxo;
};

// update account before BLOCKCHAIN.NOTIFICATION or BLOCKCHAIN.BLOCK events
// solves race condition between pushing transaction and received notification
export const getPendingAccount = (
    account: Account,
    tx: PrecomposedTransactionFinal,
    txid: string,
) => {
    // TODO: implement ETH
    if (tx.type !== 'final' || account.networkType !== 'bitcoin' || tx.useDecreaseOutput) return; // do not change user balance if tx output was decreased. balance is still the same: 0

    // calculate availableBalance
    let availableBalanceBig = new BigNumber(account.availableBalance).minus(
        tx.feeDifference || tx.totalSpent,
    );
    // get utxo
    const utxo = getUtxoFromSignedTransaction(account, tx, txid, tx.prevTxid);

    if (!tx.prevTxid) {
        // join all account addresses
        const addresses = account.addresses
            ? account.addresses.unused
                  .concat(account.addresses.used)
                  .concat(account.addresses.change)
            : [];

        tx.transaction.outputs.forEach(output => {
            if (output.address) {
                // find self address
                if (addresses.find(a => a.address === output.address)) {
                    // append self outputs to balance
                    availableBalanceBig = availableBalanceBig.plus(output.amount);
                }
            }
        });
    }

    const availableBalance = availableBalanceBig.toString();

    return {
        ...account,
        availableBalance,
        formattedBalance: formatNetworkAmount(availableBalance, account.symbol),
        utxo,
    };
};

export const hasSignVerify = (account: Account) =>
    !!NETWORKS.find(
        ({ networkType, symbol, accountType, features }) =>
            networkType === account.networkType &&
            symbol === account.symbol &&
            (accountType || 'normal') === account.accountType &&
            (features || []).includes('sign-verify'),
    );
