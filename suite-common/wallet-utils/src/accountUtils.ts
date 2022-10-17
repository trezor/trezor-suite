import BigNumber from 'bignumber.js';

import { AccountInfo, AccountAddresses, AccountAddress } from '@trezor/connect';
import { bufferUtils } from '@trezor/utils';
import {
    networksCompatibility as NETWORKS,
    Network,
    NetworkFeature,
    NetworkSymbol,
} from '@suite-common/wallet-config';
import {
    Account,
    CoinFiatRates,
    Discovery,
    PrecomposedTransactionFinal,
    PrecomposedTransactionFinalCardano,
    ReceiveInfo,
    TxFinalCardano,
} from '@suite-common/wallet-types';
import { TrezorDevice } from '@suite-common/suite-types';
import { ACCOUNT_TYPE } from '@suite-common/wallet-constants';
import { WIKI_BIP84_URL, WIKI_BIP86_URL, WIKI_BIP49_URL, WIKI_BIP44_URL } from '@trezor/urls';

import { toFiatCurrency } from './fiatConverterUtils';

export const isUtxoBased = (account: Account) =>
    account.networkType === 'bitcoin' || account.networkType === 'cardano';

export const getFirstFreshAddress = (
    account: Account,
    receiveAddresses: ReceiveInfo[],
    pendingAddresses: string[],
    utxoBasedAccount: boolean,
) => {
    const unused = account.addresses
        ? account.addresses.unused
        : [
              {
                  path: account.path,
                  address: account.descriptor,
                  transfers: account.history.total,
              },
          ];

    const unrevealed = unused.filter(
        a =>
            !receiveAddresses.find(r => r.path === a.path) &&
            !pendingAddresses.find(p => p === a.address),
    );

    // const addressLabel = utxoBasedAccount ? 'RECEIVE_ADDRESS_FRESH' : 'RECEIVE_ADDRESS';
    // NOTE: unrevealed[0] can be undefined (limit exceeded)
    const firstFreshAddress = utxoBasedAccount ? unrevealed[0] : unused[0];
    return firstFreshAddress;
};

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

export const getTitleForNetwork = (symbol: NetworkSymbol) => {
    switch (symbol.toLowerCase()) {
        case 'btc':
            return 'TR_NETWORK_BITCOIN';
        case 'test':
            return 'TR_NETWORK_BITCOIN_TESTNET';
        case 'regtest':
            return 'TR_NETWORK_BITCOIN_REGTEST';
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
        case 'tada':
            return 'TR_NETWORK_CARDANO_TESTNET';
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
        case `1852'`:
            return 'shelley';
        case `10025'`:
            return 'slip25';
        default:
            return 'unknown';
    }
};

export const getAccountTypeName = (path: string) => {
    const bip43 = getBip43Type(path);
    if (bip43 === 'bip86') return 'TR_ACCOUNT_TYPE_BIP86_NAME';
    if (bip43 === 'bip84') return 'TR_ACCOUNT_TYPE_BIP84_NAME';
    if (bip43 === 'bip49') return 'TR_ACCOUNT_TYPE_BIP49_NAME';
    if (bip43 === 'shelley') return 'TR_ACCOUNT_TYPE_SHELLEY';
    if (bip43 === 'slip25') return 'TR_ACCOUNT_TYPE_SLIP25_NAME';
    return 'TR_ACCOUNT_TYPE_BIP44_NAME';
};

export const getAccountTypeTech = (path: string) => {
    const bip43 = getBip43Type(path);
    if (bip43 === 'bip86') return 'TR_ACCOUNT_TYPE_BIP86_TECH';
    if (bip43 === 'bip84') return 'TR_ACCOUNT_TYPE_BIP84_TECH';
    if (bip43 === 'bip49') return 'TR_ACCOUNT_TYPE_BIP49_TECH';
    if (bip43 === 'shelley') return 'TR_ACCOUNT_TYPE_SHELLEY';
    if (bip43 === 'slip25') return 'TR_ACCOUNT_TYPE_SLIP25_TECH';
    return 'TR_ACCOUNT_TYPE_BIP44_TECH';
};

export const getAccountTypeDesc = (path: string) => {
    const bip43 = getBip43Type(path);
    if (bip43 === 'bip86') return 'TR_ACCOUNT_TYPE_BIP86_DESC';
    if (bip43 === 'bip84') return 'TR_ACCOUNT_TYPE_BIP84_DESC';
    if (bip43 === 'bip49') return 'TR_ACCOUNT_TYPE_BIP49_DESC';
    if (bip43 === 'shelley') return 'TR_ACCOUNT_TYPE_SHELLEY_DESC';
    if (bip43 === 'slip25') return 'TR_ACCOUNT_TYPE_SLIP25_DESC';
    return 'TR_ACCOUNT_TYPE_BIP44_DESC';
};

export const getAccountTypeUrl = (path: string) => {
    const bip43 = getBip43Type(path);
    if (bip43 === 'bip86') return WIKI_BIP86_URL;
    if (bip43 === 'bip84') return WIKI_BIP84_URL;
    if (bip43 === 'bip49') return WIKI_BIP49_URL;
    if (bip43 === 'shelley') return undefined;
    if (bip43 === 'slip25') return undefined;
    return WIKI_BIP44_URL;
};

export const getAccountDecimals = (symbol: NetworkSymbol) => {
    const network = NETWORKS.find(n => n.symbol === symbol);

    return network?.decimals;
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

export const networkAmountToSatoshi = (amount: string | null, symbol: NetworkSymbol) => {
    if (!amount) return '0';

    const decimals = getAccountDecimals(symbol);

    if (!decimals) return amount;

    return amountToSatoshi(amount, decimals);
};

export const formatNetworkAmount = (
    amount: string,
    symbol: NetworkSymbol,
    withSymbol = false,
    isSatoshis?: boolean,
) => {
    const decimals = getAccountDecimals(symbol);

    if (!decimals) return amount;

    let formattedAmount = formatAmount(amount, decimals);

    if (withSymbol) {
        let formattedSymbol = symbol?.toUpperCase();

        if (isSatoshis) {
            formattedAmount = amount;
            formattedSymbol = symbol === 'btc' ? 'sat' : `sat ${symbol?.toUpperCase()}`;
        }

        return `${formattedAmount} ${formattedSymbol}`;
    }

    return formattedAmount;
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

export const findAccountsByNetwork = (symbol: NetworkSymbol, accounts: Account[]) =>
    accounts.filter(a => a.symbol === symbol);

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

export const findAccountDevice = (account: Account, devices: TrezorDevice[]) =>
    devices.find(d => d.state === account.deviceState);

export const getAllAccounts = (deviceState: string | typeof undefined, accounts: Account[]) => {
    if (!deviceState) return [];
    return accounts.filter(a => a.deviceState === deviceState && a.visible);
};

export const getNetwork = (symbol: string): Network | null =>
    NETWORKS.find(c => c.symbol === symbol) || null;

export const isNetworkSymbol = (symbol: string): symbol is NetworkSymbol => !!getNetwork(symbol);

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

export const enhanceAddresses = (
    addresses: AccountAddresses | undefined,
    networkType: Account['networkType'],
    accountIndex: Account['index'],
): AccountAddresses | undefined => {
    // Addresses used in Suite include full derivation path including account index.
    // These addresses are derived on a backend (Blockbook/Blockfrost) from a public key.
    // In bitcoin an account index is encoded directly in a public key, so blockbook will extract it
    // and return full derivation path for each derived address.
    // (https://github.com/trezor/blockbook/blob/b82dc92522eee957b7a139c38269a1844fe102f8/bchain/coins/btc/bitcoinparser.go#L428)
    // Since cardano account public key doesn't encode information about the account index, like Bitcoin does,
    // Blockfrost backend returns partial derivation path where account index is replaced with character 'i'.
    // So we rely on the client (this function) to replace it with correct account index.

    if (!addresses) return undefined;
    if (networkType !== 'cardano') return addresses;

    const accountIndexStr = accountIndex.toString();

    const replaceAccountIndex = (address: AccountAddress) => ({
        ...address,
        path: address.path.replace('i', accountIndexStr),
    });

    const used = addresses.used.map(replaceAccountIndex);
    const unused = addresses.unused.map(replaceAccountIndex);
    const change = addresses.change.map(replaceAccountIndex);

    return { used, unused, change, anonymitySet: addresses.anonymitySet };
};

export const enhanceUtxo = (
    utxos: Account['utxo'],
    networkType: Account['networkType'],
    accountIndex: Account['index'],
): Account['utxo'] => {
    if (!utxos) return undefined;
    if (networkType !== 'cardano') return utxos;

    const accountIndexStr = accountIndex.toString();
    const enhancedUtxos = utxos.map(utxo => ({
        ...utxo,
        path: utxo.path.replace('i', accountIndexStr),
    }));

    return enhancedUtxos;
};

export const enhanceHistory = ({
    total,
    unconfirmed,
    tokens,
}: AccountInfo['history']): Account['history'] => ({
    total,
    unconfirmed,
    tokens,
});

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

export const isTestnet = (symbol: NetworkSymbol) => {
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

    const changedCardano =
        account.networkType === 'cardano' &&
        // stake address (de)registration
        (freshInfo.misc!.staking?.isActive !== account.misc.staking.isActive ||
            // changed rewards amount (rewards are distributed every epoch (5 days))
            freshInfo.misc!.staking?.rewards !== account.misc.staking.rewards ||
            // changed stake pool
            freshInfo.misc!.staking?.poolId !== account.misc.staking.poolId);

    return (
        changedTxCountOfflineFresh ||
        changedTxCountOffline ||
        changedTxCountOnline ||
        changedCardano ||
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

    if (networkType === 'cardano') {
        return {
            networkType,
            misc: {
                staking: {
                    rewards: misc && misc.staking ? misc.staking.rewards : '0',
                    isActive: misc && misc.staking ? misc.staking.isActive : false,
                    address: misc && misc.staking ? misc.staking.address : '',
                    poolId: misc && misc.staking ? misc.staking.poolId : null,
                },
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
                unconfirmed: 0,
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
    coinFilter?: NetworkSymbol,
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
    tx: PrecomposedTransactionFinalCardano | PrecomposedTransactionFinal,
    txid: string,
    prevTxid?: string,
) => {
    if (tx.type !== 'final') return [];

    // find utxo to replace
    const replaceUtxo = (prevTxid && account.utxo?.filter(u => u.txid === prevTxid)) || [];

    // remove utxo used by signed transaction or replaced by new tx (rbf)

    const findUtxo = (
        // this little func is needed in order to slightly change type inputs array to stop ts complaining
        // not sure how to do this in more elegant way
        inputs:
            | (
                  | PrecomposedTransactionFinalCardano['transaction']['inputs'][number]
                  | PrecomposedTransactionFinal['transaction']['inputs'][number]
              )[],
    ) =>
        account.utxo?.filter(
            u =>
                !inputs.find(i => i.prev_hash === u.txid && i.prev_index === u.vout) &&
                u.txid !== prevTxid,
        ) || [];

    const utxo = findUtxo(tx.transaction.inputs);

    // join all account addresses
    const addresses = account.addresses
        ? account.addresses.unused.concat(account.addresses.used).concat(account.addresses.change)
        : [];

    // append utxo created by this transaction
    tx.transaction.outputs.forEach((output, vout) => {
        let addr: AccountAddress | undefined;
        if ('address_n' in output && output.address_n) {
            // find change address
            const serialized = output.address_n.slice(3, 5).join('/');
            addr = account.addresses?.change.find(a => a.path.endsWith(serialized));
        }
        if ('address' in output) {
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
                amount: output.amount.toString(),
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
    tx: PrecomposedTransactionFinal | TxFinalCardano,
    txid: string,
) => {
    // TODO: implement ETH
    if (
        tx.type !== 'final' ||
        (account.networkType !== 'bitcoin' && account.networkType !== 'cardano') ||
        tx.useDecreaseOutput
    )
        return; // do not change user balance if tx output was decreased. balance is still the same: 0

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
            if ('address' in output) {
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

export const getNetworkFeatures = ({
    networkType,
    symbol,
    accountType,
}: Pick<Account, 'networkType' | 'symbol' | 'accountType'>) =>
    NETWORKS.find(
        network =>
            network.networkType === networkType &&
            network.symbol === symbol &&
            (network.accountType || 'normal') === accountType,
    )?.features || [];

export const hasNetworkFeatures = (
    account: Account,
    features: NetworkFeature | Array<NetworkFeature>,
) => {
    const networkFeatures = getNetworkFeatures(account);

    if (!networkFeatures) {
        return false;
    }

    const areFeaturesPresent = ([] as NetworkFeature[])
        .concat(features)
        .every(feature => networkFeatures.includes(feature));

    return areFeaturesPresent;
};

// https://developer.bitcoin.org/reference/transactions.html#outpoint-the-specific-part-of-a-specific-output
export const getUtxoOutpoint = (utxo: { txid: string; vout: number }) => {
    const hash = bufferUtils.reverseBuffer(Buffer.from(utxo.txid, 'hex'));
    const buffer = Buffer.allocUnsafe(36);
    hash.copy(buffer);
    buffer.writeUInt32LE(utxo.vout, hash.length);
    return buffer.toString('hex');
};

// https://developer.bitcoin.org/reference/transactions.html#outpoint-the-specific-part-of-a-specific-output
export const readUtxoOutpoint = (outpoint: string) => {
    const buffer = Buffer.from(outpoint, 'hex');
    const txid = bufferUtils.reverseBuffer(buffer.slice(0, 32));
    const vout = buffer.readUInt32LE(txid.length);
    return { txid: txid.toString('hex'), vout };
};
