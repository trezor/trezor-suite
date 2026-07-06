import { type TokenDtoV2 } from '@suite-common/earn-stablecoin-defs';
import type { NetworkSymbol } from '@suite-common/networks';
import type { Bip43PathTemplate } from '@trezor/crypto-utils';
import { type DeviceModelInternal } from '@trezor/device-utils';

export type { NetworkSymbol };

export const asNetworkSymbol = (symbol: string): NetworkSymbol => symbol as NetworkSymbol;

/**
 * Used for some edge cases where extension of NetworkSymbol is necessary.
 * Autocomplete is working as expected but can be passed any string.
 */
export type NetworkSymbolExtended = NetworkSymbol | (string & {});

export type NetworkType =
    'bitcoin' | 'ethereum' | 'ripple' | 'cardano' | 'solana' | 'stellar' | 'tron';

type UtilityAccountType = 'normal' | 'imported' | 'placeholder'; // reserved accountTypes to stand in for a real accountType
type RealAccountType = 'legacy' | 'segwit' | 'coinjoin' | 'taproot' | 'ledger' | 'root';
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

export type TrezorConnectBackendType = (typeof TREZOR_CONNECT_BACKENDS)[number];
type NonStandardBackendType = 'coinjoin';
export type BackendType = TrezorConnectBackendType | NonStandardBackendType;
export type ServerType = BackendType | 'default';

export type BackendOption = {
    type: BackendType;
    // Backend whose nodes run on third-party infrastructure Trezor pays for, not Trezor's own.
    isExternalBackend?: boolean;
};

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

type NetworkAccountTypes = Partial<{
    [key in AccountType]: NetworkAccountWithSpecificKey<key>;
}>;

type NetworkDeviceSupport = Partial<Record<DeviceModelInternal, string>>;

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
    backendOptions: BackendOption[];
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
    yieldXyzId: TokenDtoV2['network'] | null;
};
export type Network = NetworkWithSpecificKey<NetworkSymbol>;

export type Networks = {
    [key in NetworkSymbol]: NetworkWithSpecificKey<key>;
};
