import { type NetworkDtoId } from '@suite-common/earn-stablecoin-api';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { type RequiredKey } from '@trezor/type-utils';

export type NetworkSymbol =
    | 'btc'
    | 'ltc'
    | 'eth'
    | 'etc'
    | 'xrp'
    | 'bch'
    | 'doge'
    | 'zec'
    | 'ada'
    | 'sol'
    | 'pol'
    | 'bsc'
    | 'arb'
    | 'base'
    | 'op'
    | 'avax'
    | 'xlm'
    | 'test'
    | 'regtest'
    | 'trx'
    | 'ttrx'
    | 'tsep'
    | 'thod'
    | 'txrp'
    | 'txlm'
    | 'dsol';

export const asNetworkSymbol = (value: string) => value as NetworkSymbol;

/**
 * Used for some edge cases where extension of NetworkSymbol is necessary.
 * Autocomplete is working as expected but can be passed any string.
 */
export type NetworkSymbolExtended = NetworkSymbol | (string & {});

export type NetworkType =
    | 'bitcoin'
    | 'ethereum'
    | 'ripple'
    | 'cardano'
    | 'solana'
    | 'stellar'
    | 'tron';

type UtilityAccountType = 'normal' | 'imported' | 'placeholder'; // reserved accountTypes to stand in for a real accountType
type RealAccountType = 'legacy' | 'segwit' | 'coinjoin' | 'taproot' | 'ledger';
export type AccountType = UtilityAccountType | RealAccountType;

export const TREZOR_CONNECT_BACKENDS = [
    'blockbook',
    'electrum',
    'ripple',
    'blockfrost',
    'solana',
    'stellar',
    'evm-rpc',
] as const;

export const NON_STANDARD_BACKENDS = ['coinjoin'] as const;

export type TrezorConnectBackendType = (typeof TREZOR_CONNECT_BACKENDS)[number];
export type NonStandardBackendType = (typeof NON_STANDARD_BACKENDS)[number];
export type BackendType = TrezorConnectBackendType | NonStandardBackendType;

export type NetworkFeature =
    | 'rbf'
    | 'nfts'
    | 'sign-verify'

    // Network has sub-units (sats, ...) but it is currently used only for sats in case of BTC and testnets,
    // and not used for gwei in case of ETH. It would make sense, but it's not implemented.
    | 'amount-unit'
    | 'tokens'
    | 'staking'
    | 'coin-definitions'
    | 'nft-definitions'
    | 'eip1559'
    | 'mev-protection'
    | 'graph'
    | 'claim-rewards';

type Level = `/${number}'`;
type MaybeApostrophe = `'` | '';
type MaybeLevel = `/${number}${MaybeApostrophe}` | '';
type LevelOrIndex = `/${number | 'i'}'`;
type MaybeLevelOrIndex = `/${number | 'i'}${MaybeApostrophe}` | '';
// template with i in place of account index, which shall be substituted with a number
export type Bip43PathTemplate =
    `m${Level}${Level}${LevelOrIndex}${MaybeLevelOrIndex}${MaybeLevelOrIndex}`;
export type Bip43Path = `m${Level}${Level}${Level}${MaybeLevel}${MaybeLevel}`;

export type Explorer = {
    base: string;
    tx: string;
    address: string;
    nft?: string;
    token?: string;
    queryString?: string;
};

type NetworkAccountWithSpecificKey<TKey extends AccountType> = {
    accountType: TKey;
    bip43Path: Bip43PathTemplate;
    backendType?: BackendType;
    features?: NetworkFeature[];
    isDebugOnlyAccountType?: boolean;
};
export type NetworkAccount = NetworkAccountWithSpecificKey<AccountType>;
export type NormalizedNetworkAccount = RequiredKey<NetworkAccount, 'features'>;

export type NetworkAccountTypes = Partial<{
    [key in AccountType]: NetworkAccountWithSpecificKey<key>;
}>;

export type NetworkDeviceSupport = Partial<Record<DeviceModelInternal, string>>;

type NetworkWithSpecificKey<TKey extends NetworkSymbol> = {
    symbol: TKey;
    settlementLayer?: NetworkSymbol;
    displaySymbol: string;
    displaySymbolName?: string;
    name: string;
    networkType: NetworkType;
    bip43Path: Bip43PathTemplate;
    decimals: number;
    testnet: boolean;
    explorer: Explorer;
    accountTypes: NetworkAccountTypes;
    isHidden?: boolean; // not used here, but supported elsewhere
    chainId?: number;
    features: NetworkFeature[];
    backendTypes: BackendType[];
    support?: NetworkDeviceSupport;
    isDebugOnlyNetwork?: boolean;
    isExperimentalOnlyNetwork?: boolean;
    coingeckoId?: string;
    tradeCryptoId?: string;
    caipId?: string; // CAIP-2 chain id, used by WalletConnect
    nativeTokenReserve?: string;
    /**
     * Network ID used by Yield.xyz
     * @url https://yield.xyz
     */
    yieldXyzId: NetworkDtoId | null;
};
export type Network = NetworkWithSpecificKey<NetworkSymbol>;

export type Networks = {
    [key in NetworkSymbol]: NetworkWithSpecificKey<key>;
};
