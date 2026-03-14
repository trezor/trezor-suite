import { TrezorDevice } from '@suite-common/suite-types';
import {
    type AccountType,
    type Bip43Path,
    type Bip43PathTemplate,
    type NetworkAccount,
    type NetworkFeature,
    type NetworkSymbol,
    type NetworkSymbolExtended,
    type NetworkType,
    type TrezorConnectBackendType,
    getNetwork,
    networkSymbolCollection,
    networks,
} from '@suite-common/wallet-config';
import {
    Account,
    AccountDescriptor,
    AccountKey,
    BaseCurrencyAmount,
    FailedAccount,
    GeneralPrecomposedTransactionFinal,
    PrecomposedTransactionFinal,
    RatesByKey,
    ReceiveInfo,
    SuccessfulAccount,
    TokenAddress,
    asBaseCurrencyAmount,
    createAccountKey,
} from '@suite-common/wallet-types';
import * as solanaUtils from '@trezor/blockchain-link-solana/src/solanaUtils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import TrezorConnect, {
    AccountAddress,
    AccountAddresses,
    AccountInfo,
    AccountTransaction,
    AccountUtxo,
    DeviceState,
    PrecomposedTransactionFinalCardano,
    StaticSessionId,
    TokenInfo,
} from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';
import { HELP_CENTER_ADDRESSES_URL, HELP_CENTER_TAPROOT_URL } from '@trezor/urls';
import { BigNumber, arrayDistinct, bufferUtils } from '@trezor/utils';

import { convertAmountSubunitsToUnits, formatNetworkAmount } from './amountUtils';
import { toFiatCurrency } from './fiatConverterUtils';
import { getFiatRateKey } from './fiatRatesUtils';
import { getAccountTotalStakingBalance } from './stakingUtils';
import { shouldUppercaseTokenSymbol } from './tokenUtils';
import { isRbfBumpFeeTransaction } from './transactionUtils';

const { SYSTEM_PROGRAM_PUBLIC_KEY } = solanaUtils;

export const isUtxoBased = (account: Account) =>
    account.networkType === 'bitcoin' || account.networkType === 'cardano';

export const isAccountSuccessful = (account: Account): account is SuccessfulAccount =>
    !account.failed;

export const isAccountFailed = (account: Account): account is FailedAccount => !!account.failed;

export const isAccountDiscoverable = ({ accountType }: Account) =>
    accountType !== 'imported' && accountType !== 'placeholder' && accountType !== 'coinjoin';

export const isEvmLedger = (networkType: NetworkType, accountType: AccountType) =>
    networkType === 'ethereum' && accountType === 'ledger';

export const isEvmNetwork = (networkSymbol: NetworkSymbol): boolean =>
    getNetwork(networkSymbol).networkType === 'ethereum';

const getAccountIndexOffset = (networkType: NetworkType, accountType: AccountType): number =>
    isEvmLedger(networkType, accountType) ? 1 : 0;

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

/** NOTE: input addresses' paths sequence must be uninterrupted and start with 0 */
export const sortByBIP44AddressIndex = <T extends { path: string }>(
    pathBase: string,
    addresses: T[],
) => {
    const lookup = addresses.reduce<{ [path: string]: number }>((prev, _, i) => {
        prev[`${pathBase}/${i}`] = i;

        return prev;
    }, {});

    return addresses.slice().sort((a, b) => lookup[a.path] - lookup[b.path]);
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

export const getTitleForCoinjoinAccount = (symbol: NetworkSymbolExtended) => {
    switch (symbol) {
        case 'test':
            return 'TR_NETWORK_COINJOIN_BITCOIN_TESTNET';
        case 'regtest':
            return 'TR_NETWORK_COINJOIN_BITCOIN_REGTEST';
        case 'btc':
        default:
            return 'TR_NETWORK_COINJOIN_BITCOIN';
    }
};

const getAccountTypePrefix = (path: string) => {
    if (typeof path !== 'string') return null;
    const coinType = path.split('/')[2];
    switch (coinType) {
        case `501'`: {
            return 'TR_ACCOUNT_TYPE_SOLANA_BIP44_CHANGE';
        }
        default:
            return null;
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

export const substituteBip43Path = (
    bip43PathTemplate: Bip43PathTemplate,
    accountIndex: string | number = '0',
) => bip43PathTemplate.replace('i', String(accountIndex)) as Bip43Path;

type getAccountTypeNameProps = {
    path?: Bip43PathTemplate;
    networkType?: NetworkType;
    accountType?: AccountType;
};

export const getAccountTypeName = ({ path, accountType, networkType }: getAccountTypeNameProps) => {
    if (!networkType) return null;

    if (networkType !== 'bitcoin') {
        switch (accountType) {
            case 'ledger':
                return 'TR_ACCOUNT_TYPE_LEDGER';
            case 'legacy':
                return 'TR_ACCOUNT_TYPE_LEGACY';
            case 'normal':
                return 'TR_ACCOUNT_TYPE_DEFAULT';
            case 'placeholder':
                return 'TR_ACCOUNT_TYPE_DEFAULT';
        }
    }

    switch (accountType) {
        case 'segwit':
            return 'TR_ACCOUNT_TYPE_SEGWIT';
        case 'taproot':
            return 'TR_ACCOUNT_TYPE_TAPROOT';
        case 'normal':
            return 'TR_ACCOUNT_TYPE_BIP84_NAME';
        case 'legacy':
            return 'TR_ACCOUNT_TYPE_LEGACY';
    }

    if (!path) return null;
    // TODO: is this used?

    const bip43 = getBip43Type(path);
    if (bip43 === 'bip86') return 'TR_ACCOUNT_TYPE_BIP86_NAME';
    if (bip43 === 'bip84') return 'TR_ACCOUNT_TYPE_BIP84_NAME';
    if (bip43 === 'bip49') return 'TR_ACCOUNT_TYPE_BIP49_NAME';
    if (bip43 === 'shelley') return 'TR_ACCOUNT_TYPE_SHELLEY';
    if (bip43 === 'slip25') return 'TR_ACCOUNT_TYPE_SLIP25_NAME';

    return 'TR_ACCOUNT_TYPE_BIP44_NAME';
};

export const getAccountTypeTech = (path: Bip43PathTemplate) => {
    const accountTypePrefix = getAccountTypePrefix(path);
    if (accountTypePrefix) return `${accountTypePrefix}_TECH` as const;
    const bip43 = getBip43Type(path);
    if (bip43 === 'bip86') return 'TR_ACCOUNT_TYPE_BIP86_TECH';
    if (bip43 === 'bip84') return 'TR_ACCOUNT_TYPE_BIP84_TECH';
    if (bip43 === 'bip49') return 'TR_ACCOUNT_TYPE_BIP49_TECH';
    if (bip43 === 'shelley') return 'TR_ACCOUNT_TYPE_SHELLEY';
    if (bip43 === 'slip25') return 'TR_ACCOUNT_TYPE_SLIP25_TECH';

    return 'TR_ACCOUNT_TYPE_BIP44_TECH';
};

type getAccountTypeDescProps = {
    path: Bip43PathTemplate;
    accountType?: AccountType;
    networkType?: NetworkType;
};

export const getAccountTypeDesc = ({ path, accountType, networkType }: getAccountTypeDescProps) => {
    switch (accountType) {
        case 'ledger':
            return 'TR_ACCOUNT_TYPE_LEDGER_DESC';
        case 'legacy':
            if (networkType === 'cardano') {
                return 'TR_ACCOUNT_TYPE_CARDANO_LEGACY_DESC';
            }

            return 'TR_ACCOUNT_TYPE_LEGACY_DESC';
    }

    switch (networkType) {
        case 'ethereum':
        case 'tron':
            return 'TR_ACCOUNT_TYPE_NORMAL_EVM_DESC';
        case 'solana':
            return 'TR_ACCOUNT_TYPE_NORMAL_SOLANA_DESC';
        case 'cardano':
            return 'TR_ACCOUNT_TYPE_NORMAL_CARDANO_DESC';
        case 'ripple':
            return 'TR_ACCOUNT_TYPE_XRP_DESC';
        case 'stellar':
            return 'TR_ACCOUNT_TYPE_STELLAR_DESC';
    }

    const bip43 = getBip43Type(path);
    switch (bip43) {
        case 'bip86':
            return 'TR_ACCOUNT_TYPE_BIP86_DESC';
        case 'bip84':
            return 'TR_ACCOUNT_TYPE_BIP84_DESC';
        case 'bip49':
            return 'TR_ACCOUNT_TYPE_BIP49_DESC';
        case 'slip25':
            return 'TR_ACCOUNT_TYPE_SLIP25_DESC';
    }

    return 'TR_ACCOUNT_TYPE_BIP44_DESC';
};

export const getAccountTypeUrl = (path: string) => {
    const bip43 = getBip43Type(path);
    switch (bip43) {
        case 'bip86':
            return HELP_CENTER_TAPROOT_URL;
        case 'shelley':
            return undefined;
        default:
            return HELP_CENTER_ADDRESSES_URL;
    }
};

/**
 * Sort accounts as they are defined in `networksConfig`, by two criteria:
 * - primary: by network `symbol`
 * - secondary: by `accountType`
 */
export const sortByCoin = <T extends Account>(accounts: T[]) =>
    accounts.sort((a, b) => {
        // primary sorting: by order of network keys
        const aSymbolIndex = networkSymbolCollection.indexOf(a.symbol);
        const bSymbolIndex = networkSymbolCollection.indexOf(b.symbol);
        if (aSymbolIndex !== bSymbolIndex) return aSymbolIndex - bSymbolIndex;

        // when it is sorted by network, sort by order of accountType keys within the same network
        const network = networks[a.symbol];
        const orderedAccountTypes = Object.keys(network.accountTypes) as AccountType[];
        const aAccountTypeIndex = orderedAccountTypes.indexOf(a.accountType);
        const bAccountTypeIndex = orderedAccountTypes.indexOf(b.accountType);

        if (aAccountTypeIndex !== bAccountTypeIndex) return aAccountTypeIndex - bAccountTypeIndex;

        // if both are same, keep the original order in `accounts`
        return a.index - b.index;
    });

export const findAccountsByNetwork = <T extends Account>(symbol: NetworkSymbol, accounts: T[]) =>
    accounts.filter(a => a.symbol === symbol);

export const findAccountsByDescriptor = (descriptor: string, accounts: Account[]) =>
    accounts.filter(a => a.descriptor === descriptor);

export const findAccountsByAddress = (
    symbol: NetworkSymbol,
    address: string,
    accounts: Account[],
) =>
    accounts
        .filter(account => account.symbol === symbol)
        .filter(a => {
            if (a.addresses) {
                return (
                    a.addresses.used.some(u => u.address === address) ||
                    a.addresses.unused.some(u => u.address === address) ||
                    a.addresses.change.some(u => u.address === address) ||
                    a.descriptor === address
                );
            }

            return a.descriptor === address;
        });

export const findAccountDevice = (account: Account, devices: TrezorDevice[]) =>
    devices.find(d => d.state?.staticSessionId === account.deviceState);

export const getAllAccounts = (
    deviceState: DeviceState | StaticSessionId | typeof undefined,
    accounts: Account[],
) => {
    if (!deviceState) return [];

    return accounts.filter(
        a =>
            (typeof deviceState === 'string'
                ? a.deviceState === deviceState
                : a.deviceState === deviceState.staticSessionId) && a.visible,
    );
};

/**
 * Clear invalid tokens and formats amounts
 *
 * @param {Account['tokens']} tokens
 * @returns {Account['tokens']}
 */
export const enhanceTokens = (tokens: Account['tokens']) => {
    if (!tokens) return [];

    return tokens.map(t => {
        const symbol = t.symbol || t.contract;

        return {
            ...t,
            name: t.name || symbol,
            symbol: shouldUppercaseTokenSymbol(t) ? symbol.toUpperCase() : symbol,
            balance: convertAmountSubunitsToUnits(t.balance || 0, t.decimals),
        };
    });
};

const countAddressTransfers = (transactions: AccountTransaction[]) =>
    transactions
        .flatMap(tx =>
            tx.details.vin
                .concat(tx.details.vout)
                .flatMap(({ addresses }) => addresses ?? [])
                .filter(arrayDistinct),
        )
        .reduce(
            (transfers, address) => ({ ...transfers, [address]: (transfers[address] ?? 0) + 1 }),
            {} as { [address: string]: number },
        );

export const enhanceAddresses = (
    { addresses, history: { transactions = [] }, page }: AccountInfo,
    {
        networkType,
        index: accountIndex,
        addresses: oldAddresses,
    }: Pick<Account, 'networkType' | 'index' | 'addresses'>,
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

    switch (networkType) {
        case 'cardano': {
            const replaceAccountIndex = (address: AccountAddress) => ({
                ...address,
                path: substituteBip43Path(address.path as Bip43PathTemplate, accountIndex),
            });

            return {
                ...addresses,
                used: addresses.used.map(replaceAccountIndex),
                unused: addresses.unused.map(replaceAccountIndex),
                change: addresses.change.map(replaceAccountIndex),
            };
        }
        case 'bitcoin': {
            // Pending txs (for counting recently used change addresses) are only
            // on first page of Blockbook getAccountInfo responses (moreover, electrum & coinjoin
            // backends always return page.index = 1)
            if (page?.index !== 1) return oldAddresses ?? addresses;

            const pendingTxs = transactions.filter(({ blockHeight = 0 }) => blockHeight <= 0);
            if (!pendingTxs.length) return addresses;

            const pendingTransfers = countAddressTransfers(pendingTxs);
            const addPendingTransfers = (address: AccountAddress) => ({
                ...address,
                transfers: address.transfers || pendingTransfers[address.address] || 0,
            });

            return {
                ...addresses,
                change: addresses.change.map(addPendingTransfers),
            };
        }
        default:
            return addresses;
    }
};

export const enhanceUtxo = (
    utxos: Account['utxo'],
    networkType: Account['networkType'],
    accountIndex: Account['index'],
): Account['utxo'] => {
    if (!utxos) return undefined;
    if (networkType !== 'cardano') return utxos;

    const enhancedUtxos = utxos.map(utxo => ({
        ...utxo,
        path: substituteBip43Path(utxo.path as Bip43PathTemplate, accountIndex),
    }));

    return enhancedUtxos;
};

export const enhanceHistory = ({
    total,
    unconfirmed,
    tokens,
    addrTxCount,
    txids,
}: AccountInfo['history']): Account['history'] => ({
    total,
    unconfirmed,
    tokens,
    addrTxCount,
    txids,
});

export const areTokenFiatRatesLoading = (
    account: Account,
    baseCurrencyCode: BaseCurrencyCode,
    rates: RatesByKey,
) =>
    (account.tokens ?? []).some(token => {
        const tokenFiatRateKey = getFiatRateKey(
            account.symbol,
            baseCurrencyCode,
            token.contract as TokenAddress,
        );

        // NOTE: designed the rate as loading only if it is loading and NO rate is currently available
        return (
            rates?.[tokenFiatRateKey]?.isLoading &&
            !rates?.[tokenFiatRateKey]?.rate &&
            rates?.[tokenFiatRateKey]?.rate !== 0
        );
    });

type GetTokenFiatBalanceParams = {
    accountSymbol: NetworkSymbol;
    token: TokenInfo;
    baseCurrencyCode: BaseCurrencyCode;
    rates?: RatesByKey;
};

export function getTokenFiatBalance({
    accountSymbol,
    token,
    baseCurrencyCode,
    rates,
}: GetTokenFiatBalanceParams): BaseCurrencyAmount {
    const tokenFiatRateKey = getFiatRateKey(
        accountSymbol,
        baseCurrencyCode,
        token.contract as TokenAddress,
    );

    const tokenFiatRate = rates?.[tokenFiatRateKey];

    return asBaseCurrencyAmount(
        toFiatCurrency({
            amount: token.balance ?? '0',
            rate: tokenFiatRate?.rate ?? 0,
        }) ?? new BigNumber(0),
    );
}

export const getAccountTokensFiatBalance = (
    account: Account,
    baseCurrencyCode: BaseCurrencyCode,
    rates?: RatesByKey,
    tokens?: Account['tokens'],
): BaseCurrencyAmount =>
    asBaseCurrencyAmount(
        (tokens ?? []).reduce((total, token) => {
            const tokenFiatBalance = getTokenFiatBalance({
                accountSymbol: account.symbol,
                token,
                baseCurrencyCode,
                rates,
            });

            return total.plus(tokenFiatBalance);
        }, new BigNumber(0)),
    );

const getStakingFiatBalance = (account: Account, rate: number | undefined) => {
    const balance = getAccountTotalStakingBalance(account) ?? '0';

    return toFiatCurrency({ amount: balance, rate });
};

type GetAccountFiatBalanceParams = {
    account: Account;
    baseCurrencyCode: BaseCurrencyCode;
    rates?: RatesByKey;
    shouldIncludeTokens?: boolean;
    shouldIncludeStaking?: boolean;
};

export const getAccountFiatBalance = ({
    account,
    baseCurrencyCode,
    rates,
    shouldIncludeTokens = true,
    shouldIncludeStaking = true,
}: GetAccountFiatBalanceParams) => {
    const coinFiatRateKey = getFiatRateKey(account.symbol, baseCurrencyCode);
    const coinFiatRate = rates?.[coinFiatRateKey];

    if (!coinFiatRate?.rate) return null;

    let totalBalance = new BigNumber(0);

    // account fiat balance
    const accountBalance = toFiatCurrency({
        amount: account.formattedBalance,
        rate: coinFiatRate.rate,
    });
    totalBalance = totalBalance.plus(accountBalance ?? 0);

    // sum fiat value of all tokens
    if (shouldIncludeTokens) {
        const tokensBalance = getAccountTokensFiatBalance(
            account,
            baseCurrencyCode,
            rates,
            account.tokens,
        );
        totalBalance = totalBalance.plus(tokensBalance ?? 0);
    }

    // account staking balance, Cardano staking should never be included as it would double the total
    if (shouldIncludeStaking && account.networkType !== 'cardano') {
        const stakingBalance = getStakingFiatBalance(account, coinFiatRate.rate);
        totalBalance = totalBalance.plus(stakingBalance ?? 0);
    }

    return asBaseCurrencyAmount(totalBalance);
};

type GetTotalFiatBalanceParams = {
    deviceAccounts: Account[];
    baseCurrencyCode: BaseCurrencyCode;
    rates?: RatesByKey;
    shouldIncludeTokens?: boolean;
    shouldIncludeStaking?: boolean;
};

export const getTotalFiatBalance = ({
    deviceAccounts,
    baseCurrencyCode,
    rates,
    shouldIncludeTokens = true,
    shouldIncludeStaking = true,
}: GetTotalFiatBalanceParams) => {
    let instanceBalance = new BigNumber(0);

    deviceAccounts.forEach(account => {
        const accountFiatBalance =
            getAccountFiatBalance({
                account,
                baseCurrencyCode,
                rates,
                shouldIncludeTokens,
                shouldIncludeStaking,
            }) ?? '0';
        instanceBalance = instanceBalance.plus(accountFiatBalance);
    });

    return instanceBalance;
};

export const isTestnet = (symbol: NetworkSymbol) => networks[symbol].testnet;

export const isAccountOutdated = (account: Account, freshInfo: AccountInfo) => {
    if (
        // if backend/coin supports addrTxCount, compare it instead of total
        typeof freshInfo.history.addrTxCount === 'number'
            ? // addrTxCount (address/tx pairs) is different than before
              account.history.addrTxCount !== freshInfo.history.addrTxCount
            : // confirmed tx count is different than before
              // (unreliable for different getAccountInfo levels, that's why addrTxCount was added)
              account.history.total !== freshInfo.history.total
    )
        return true;

    // unconfirmed tx count is different than before
    if (account.history.unconfirmed !== freshInfo.history.unconfirmed) return true;

    switch (account.networkType) {
        case 'ripple':
            // different sequence or balance
            return (
                freshInfo.misc!.sequence !== account.misc.sequence ||
                freshInfo.balance !== account.balance ||
                freshInfo.misc!.reserve !== account.misc.reserve
            );
        case 'stellar':
            // different sequence or balance
            return (
                freshInfo.misc!.stellarSequence !== account.misc.stellarSequence ||
                freshInfo.balance !== account.balance ||
                freshInfo.misc!.reserve !== account.misc.reserve ||
                // compare token balances (detect token balance changes)
                JSON.stringify(freshInfo.tokens) !== JSON.stringify(account.tokens)
            );
        case 'ethereum':
            return (
                freshInfo.misc!.nonce !== account.misc.nonce ||
                freshInfo.balance !== account.balance || // balance can change because of beacon chain/internal txs
                JSON.stringify(freshInfo?.misc?.stakingPools) !==
                    JSON.stringify(account?.misc?.stakingPools)
            );
        case 'cardano':
            return (
                // stake address (de)registration
                freshInfo.misc!.staking?.isActive !== account.misc.staking.isActive ||
                // changed rewards amount (rewards are distributed every epoch (5 days))
                freshInfo.misc!.staking?.rewards !== account.misc.staking.rewards ||
                // changed stake pool
                freshInfo.misc!.staking?.poolId !== account.misc.staking.poolId
            );
        case 'solana':
            return (
                // compare last transaction signature since the total number of txs may not be fetched fully
                freshInfo.history.txids?.[0] !== account.history.txids?.[0] ||
                // compare last epoch
                freshInfo.misc?.solEpoch !== account.misc?.solEpoch ||
                // compare token count (detect added/removed tokens)
                freshInfo.tokens?.length !== account.tokens?.length
            );
        default:
            return false;
    }
};

// Used in accountActions and failed accounts
export const getAccountSpecific = (accountInfo: Partial<AccountInfo>, networkType: NetworkType) => {
    const { misc } = accountInfo;
    if (networkType === 'ripple') {
        return {
            networkType,
            misc: {
                sequence: misc && misc.sequence ? misc.sequence : 0,
                reserve: misc && misc.reserve ? misc.reserve : '0',
            },
            marker: accountInfo.marker,
            stellarCursor: undefined,
            page: undefined,
        };
    }

    if (networkType === 'ethereum') {
        return {
            networkType,
            misc: {
                ...misc,
                nonce: misc && misc.nonce ? misc.nonce : '0',
            },
            marker: undefined,
            stellarCursor: undefined,
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
                    drep: misc && misc.staking ? misc.staking.drep : null,
                },
            },
            marker: undefined,
            stellarCursor: undefined,
            page: accountInfo.page,
        };
    }

    if (networkType === 'solana') {
        return {
            networkType,
            misc: {
                rent: misc?.rent,
                solStakingAccounts: misc?.solStakingAccounts,
                solExternalStakingAccounts: misc?.solExternalStakingAccounts,
                solEpoch: misc?.solEpoch,
                owner: misc?.owner,
            },
            marker: undefined,
            stellarCursor: undefined,
            page: accountInfo.page,
        };
    }

    if (networkType === 'stellar') {
        return {
            networkType,
            misc: {
                stellarSequence: misc?.stellarSequence ?? '0',
                reserve: misc?.reserve ?? '0',
            },
            marker: undefined,
            stellarCursor: accountInfo.stellarCursor,
            page: undefined,
        };
    }

    if (networkType === 'tron') {
        return {
            networkType,
            misc: { ...misc },
            marker: undefined,
            stellarCursor: undefined,
            page: accountInfo.page,
        };
    }

    return {
        networkType,
        misc: undefined,
        marker: undefined,
        stellarCursor: undefined,
        page: accountInfo.page,
    };
};

export const getAccountIdentifier = (account: Account) => ({
    descriptor: account.descriptor,
    symbol: account.symbol,
    deviceState: account.deviceState,
});

export type AccountSearchParams = {
    coinsFilter?: NetworkSymbol[] | NetworkSymbol;

    /** Needs to be mandatory, so it is no forgotten. */
    accountLabel: string;

    /** Return true if the account has token that match the search string */
    tokensMatch?: boolean;
};

export const accountSearchFn = (
    account: Account,
    rawSearchString: string | undefined,
    { coinsFilter, accountLabel, tokensMatch = true }: AccountSearchParams,
) => {
    let coinsFilterArray: NetworkSymbol[] = [];

    if (coinsFilter !== undefined) {
        if (Array.isArray(coinsFilter)) {
            coinsFilterArray = coinsFilter;
        } else {
            coinsFilterArray = [coinsFilter];
        }
    }

    // if coin filter is active and account symbol doesn't match return false and don't continue the search
    const symbolFilterMatch =
        coinsFilterArray.length > 0 ? coinsFilterArray.includes(account.symbol) : true;
    if (!symbolFilterMatch) return false;

    const searchString = rawSearchString?.trim().toLowerCase();
    if (!searchString) return true; // no search string

    const network = networks[account.symbol];

    // helper func for searching in account's addresses
    const matchAddressFn = (u: NonNullable<Account['addresses']>['used'][number]) =>
        u.address.toLowerCase() === searchString;

    const accountNumberMatch = `#${account.index + 1} ${account.accountType}`
        .toLowerCase()
        .includes(searchString);
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

    const accountLabelMatch = accountLabel.toLowerCase().includes(searchString);

    const filterTokens = (token: TokenInfo) =>
        token.name?.toLowerCase().includes(searchString) ||
        token.symbol?.toLowerCase().includes(searchString) ||
        token.contract.toLowerCase().includes(searchString);

    const tokenMatch =
        tokensMatch && !!account.tokens && !!account.tokens.filter(filterTokens).length;

    return (
        accountNumberMatch ||
        symbolMatch ||
        networkNameMatch ||
        accountTypeMatch ||
        descriptorMatch ||
        addressMatch ||
        matchXRPAlternativeName ||
        accountLabelMatch ||
        tokenMatch
    );
};

export const getUtxoFromSignedTransaction = ({
    account,
    receivingAccount,
    tx,
    txid,
    prevTxid,
}: {
    account: Account;
    receivingAccount?: boolean;
    tx: GeneralPrecomposedTransactionFinal;
    txid: string;
    prevTxid?: string;
}) => {
    if (tx.type !== 'final') return [];

    // find utxo to replace
    const replaceUtxo = (prevTxid && account.utxo?.filter(u => u.txid === prevTxid)) || [];

    // remove utxo used by signed transaction or replaced by new tx (rbf)

    const findUtxo = (
        // this little func is needed in order to slightly change type inputs array to stop ts complaining
        // not sure how to do this in more elegant way
        inputs: (
            | PrecomposedTransactionFinalCardano['inputs'][number]
            | PrecomposedTransactionFinal['inputs'][number]
        )[],
    ) =>
        account.utxo?.filter(
            u =>
                !inputs.find(i => i.prev_hash === u.txid && i.prev_index === u.vout) &&
                u.txid !== prevTxid,
        ) || [];

    const utxo = findUtxo(tx.inputs);

    // join all account addresses
    const addresses = account.addresses
        ? account.addresses.unused.concat(account.addresses.used).concat(account.addresses.change)
        : [];

    // append utxo created by this transaction
    tx.outputs.forEach((output, vout) => {
        let addr: AccountAddress | undefined;
        if (!receivingAccount && 'address_n' in output && output.address_n) {
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

/**
 * Returns concatenation of addresses.unused, addresses.used, addresses.changed
 */
export const getAccountAddresses = (account: Account) =>
    account.addresses
        ? account.addresses.unused.concat(account.addresses.used).concat(account.addresses.change)
        : [];

// update account before BLOCKCHAIN.NOTIFICATION or BLOCKCHAIN.BLOCK events
// solves race condition between pushing transaction and received notification
export const getPendingAccount = ({
    account,
    receivingAccount,
    tx,
    txid,
}: {
    account: Account;
    receivingAccount?: boolean;
    tx: GeneralPrecomposedTransactionFinal;
    txid: string;
}) => {
    // calculate availableBalance
    let availableBalanceBig = new BigNumber(account.availableBalance);

    const isBumpFeeRbf = isRbfBumpFeeTransaction(tx);

    if (!receivingAccount) {
        availableBalanceBig = availableBalanceBig.minus(
            isBumpFeeRbf ? tx.feeDifference : tx.totalSpent,
        );
    }
    // get utxo
    const utxo = getUtxoFromSignedTransaction({
        account,
        tx,
        txid,
        prevTxid: isBumpFeeRbf ? tx.prevTxid : undefined,
        receivingAccount,
    });

    if (!isBumpFeeRbf) {
        // join all account addresses

        const addresses = getAccountAddresses(account);

        tx.outputs.forEach(output => {
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

export const getNetworkAccountFeatures = ({
    symbol,
    accountType,
}: Pick<Account, 'symbol' | 'accountType'>): NetworkFeature[] => {
    const matchedNetwork = getNetwork(symbol);

    return matchedNetwork.accountTypes[accountType]?.features ?? matchedNetwork.features;
};

export const hasNetworkFeatures = (
    account: Account | undefined,
    features: NetworkFeature | Array<NetworkFeature>,
) => {
    if (!account) {
        return false;
    }

    const networkFeatures = getNetworkAccountFeatures(account);

    const areFeaturesPresent = ([] as NetworkFeature[])
        .concat(features)
        .every(feature => networkFeatures.includes(feature));

    return areFeaturesPresent;
};

// https://developer.bitcoin.org/reference/transactions.html#outpoint-the-specific-part-of-a-specific-output
export const getUtxoOutpoint = (utxo: { txid: string; vout: number }) => {
    if (utxo.txid.length !== 64) {
        throw new Error('Invalid length of txid');
    }
    const hash = bufferUtils.reverseBuffer(Buffer.from(utxo.txid, 'hex'));
    const buffer = Buffer.allocUnsafe(36);
    hash.copy(buffer);
    buffer.writeUInt32LE(utxo.vout, hash.length);

    return buffer.toString('hex');
};

// https://developer.bitcoin.org/reference/transactions.html#outpoint-the-specific-part-of-a-specific-output
export const readUtxoOutpoint = (outpoint: string) => {
    const buffer = Buffer.from(outpoint, 'hex');
    const txid = bufferUtils.reverseBuffer(buffer.subarray(0, 32));
    const vout = buffer.readUInt32LE(txid.length);

    return { txid: txid.toString('hex'), vout };
};

export const isSameUtxo = (a: AccountUtxo, b: AccountUtxo) =>
    a.txid === b.txid && a.vout === b.vout;

/**
 * Returns true if the network uses receive address instead of XPUB.
 */
export const isAddressBasedNetwork = (networkType: NetworkType) => {
    if (networkType === 'bitcoin') return false;
    if (networkType === 'cardano') return false;
    if (networkType === 'ethereum') return true;
    if (networkType === 'tron') return true;
    if (networkType === 'ripple') return true;
    if (networkType === 'solana') return true;
    if (networkType === 'stellar') return true;

    return exhaustive(networkType);
};

export const accountEqualTo = (a: Account) => (b: Account) =>
    a.deviceState === b.deviceState &&
    a.symbol === b.symbol &&
    a.accountType === b.accountType &&
    a.index === b.index &&
    // TODO just to be sure; delete later
    (() => {
        // if the accounts seem equal but the descriptors are different
        if (a.descriptor !== b.descriptor) {
            const { deviceState, symbol, accountType, index } = a;
            console.warn('Potentially equal accounts with different descriptors!', {
                deviceState,
                symbol,
                accountType,
                index,
                descriptors: [a.descriptor, b.descriptor],
            });
        }

        return true;
    })();

/**
 * @deprecated This is only helper function to work with legacy AccountKey. Always prefer
 *             to use `AccountDescriptor`, `NetworkSymbol` and `StaticSessionId` separately.
 */
export const parseAccountKey = (accountKey: AccountKey) => {
    const [accountDescriptor, networkSymbol, deviceStaticSessionId] = accountKey.split('-');

    return {
        accountDescriptor: accountDescriptor as AccountDescriptor,
        networkSymbol: networkSymbol as NetworkSymbol,
        deviceStaticSessionId: deviceStaticSessionId as StaticSessionId,
    };
};

/**
 * Returns a string used as an index to separate txs for given account inside a transactions reducer
 *
 * @deprecated use createAccountKey directly
 */
export const getAccountKey = createAccountKey;

export const prepareNewAccountPayload = async ({
    accountType,
    networkSymbol,
    index,
    backendType,
    selectedAccount,
    accountTypes,
    device,
}: {
    accountType: AccountType;
    networkSymbol: NetworkSymbol;
    index: number;
    backendType?: TrezorConnectBackendType;
    selectedAccount?: NetworkAccount;
    accountTypes?: NetworkAccount[];
    device: TrezorDevice;
}) => {
    const network = getNetwork(networkSymbol);
    const networkAccount =
        selectedAccount ?? accountTypes?.find(v => v.accountType === accountType);

    const accountIndex = index + getAccountIndexOffset(network.networkType, accountType);

    const newPath = networkAccount?.bip43Path.replace('i', String(accountIndex));

    if (!newPath || !device.state?.staticSessionId) return new Error('Missing path');

    const res = await TrezorConnect.getAccountInfo({
        path: newPath,
        coin: networkSymbol,
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
            useEmptyPassphrase: device.useEmptyPassphrase,
        },
        details: 'txs',
    });

    if (!res.success) return new Error(res.error.message);

    return {
        accountInfo: res.payload,
        visible: true,
        deviceState: device.state.staticSessionId,
        symbol: networkSymbol,
        index,
        accountType,
        path: newPath as Bip43Path,
        backendType,
    };
};

interface FiatBalanceInDescComparatorProps {
    accountA: Account;
    accountB: Account;
    baseCurrencyCode: BaseCurrencyCode;
    fiatRates: RatesByKey;
}

export function accountsFiatBalanceInDescOrderComparator({
    accountA,
    accountB,
    baseCurrencyCode,
    fiatRates,
}: FiatBalanceInDescComparatorProps) {
    const accountAFiatBalance =
        getAccountFiatBalance({
            account: accountA,
            baseCurrencyCode,
            rates: fiatRates,
            shouldIncludeTokens: true,
            shouldIncludeStaking: false,
        }) ?? new BigNumber(0);

    const accountBFiatBalance =
        getAccountFiatBalance({
            account: accountB,
            baseCurrencyCode,
            rates: fiatRates,
            shouldIncludeTokens: true,
            shouldIncludeStaking: false,
        }) ?? new BigNumber(0);

    if (accountBFiatBalance.gt(accountAFiatBalance)) {
        return 1;
    }

    if (accountAFiatBalance.gt(accountBFiatBalance)) {
        return -1;
    }

    return 0;
}

export const isProgramDerivedAccount = (data: AccountInfo) =>
    !(data?.misc?.owner === SYSTEM_PROGRAM_PUBLIC_KEY || data?.misc?.owner === undefined);

export function filterAccountsByNetworkSymbol<T extends Account>(
    accounts: T[],
    networkSymbol: NetworkSymbol | undefined,
): T[] {
    return networkSymbol ? findAccountsByNetwork(networkSymbol, accounts) : accounts;
}

export const getAccountsWithSomeTransactionHistory = (accounts: Account[]) =>
    accounts.filter(account => account.history.total + (account.history.unconfirmed || 0));

export const accumulateAccountCountBySymbolAndType = (
    acc: Record<string, number>,
    { symbol, accountType }: Account,
) => {
    const accType = accountType === 'coinjoin' ? 'taproot' : accountType;
    const id = `${symbol}_${accType}`;
    acc[id] = (acc[id] || 0) + 1;

    return acc;
};

export const getAvailableAccountTypes = (
    networkSymbol: NetworkSymbol,
    options: {
        isCoinjoinVisible?: boolean;
        isDebug?: boolean;
    } = { isCoinjoinVisible: false, isDebug: false },
): NetworkAccount[] => {
    const { isCoinjoinVisible, isDebug } = options;
    const network = getNetwork(networkSymbol);

    const defaultAccount: NetworkAccount = {
        bip43Path: network.bip43Path,
        accountType: 'normal',
    };
    const otherAccounts = Object.values(network.accountTypes)
        /**
         * Filter out coinjoin account type if it is not visible.
         * Visibility of coinjoin account type depends on coinjoin feature config in message system.
         * By default it is visible publicly, but it can be remotely hidden under debug menu.
         */
        .filter(({ backendType }) => backendType !== 'coinjoin' || isCoinjoinVisible)
        .filter(({ isDebugOnlyAccountType }) => !isDebugOnlyAccountType || isDebug);

    // the default account is expected to be the first one
    return [defaultAccount, ...otherAccounts];
};
