import { DeviceModelInternal } from '@trezor/connect';

export type NetworkSymbol =
    | 'btc'
    | 'ltc'
    | 'eth'
    | 'etc'
    | 'xrp'
    | 'bch'
    | 'btg'
    | 'dash'
    | 'dgb'
    | 'doge'
    | 'nmc'
    | 'vtc'
    | 'zec'
    | 'ada'
    | 'sol'
    | 'matic'
    | 'bnb'
    | 'test'
    | 'regtest'
    | 'tsep'
    | 'thol'
    | 'txrp'
    | 'tada'
    | 'dsol';

export type NetworkType = 'bitcoin' | 'ethereum' | 'ripple' | 'cardano' | 'solana';

type UtilityAccountType = 'normal' | 'imported'; // reserved accountTypes to stand in for a real accountType
type RealAccountType = 'legacy' | 'segwit' | 'coinjoin' | 'taproot' | 'ledger';
export type AccountType = UtilityAccountType | RealAccountType;

export const TREZOR_CONNECT_BACKENDS = [
    'blockbook',
    'electrum',
    'ripple',
    'blockfrost',
    'solana',
] as const;
export const NON_STANDARD_BACKENDS = ['coinjoin'] as const;

type TrezorConnectBackendType = (typeof TREZOR_CONNECT_BACKENDS)[number];
type NonStandardBackendType = (typeof NON_STANDARD_BACKENDS)[number];
export type BackendType = TrezorConnectBackendType | NonStandardBackendType;

export type NetworkFeature =
    | 'rbf'
    | 'sign-verify'
    | 'amount-unit'
    | 'tokens'
    | 'staking'
    | 'coin-definitions'
    | 'nft-definitions';

export type Explorer = {
    tx: string;
    account: string;
    address: string;
    nft?: string;
    token?: string;
    queryString?: string;
};

export type Account = {
    bip43Path: string;
    backendType?: BackendType;
    features?: NetworkFeature[];
    isDebugOnlyAccountType?: boolean;
};

// template types serve only to check if `networks` satisfies it. Exact type is inferred below
export type NetworkAccountTypes = Partial<Record<AccountType, Account>>;

export type NetworkDeviceSupport = Partial<Record<DeviceModelInternal, string>>;

export type Network = {
    symbol: NetworkSymbol;
    name: string;
    networkType: NetworkType;
    bip43Path: string;
    decimals: number;
    testnet: boolean;
    explorer: Explorer;
    accountTypes: NetworkAccountTypes;
    isHidden?: boolean; // not used here, but supported elsewhere
    chainId?: number;
    features: NetworkFeature[];
    customBackends: BackendType[];
    support?: NetworkDeviceSupport;
    isDebugOnlyNetwork?: boolean;
    coingeckoId?: string;
};

export type Networks = {
    [key in NetworkSymbol]: Network;
};
