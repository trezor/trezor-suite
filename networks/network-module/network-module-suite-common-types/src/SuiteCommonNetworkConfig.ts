import type { Bip43PathTemplate } from '@trezor/crypto-utils';
import type { DeviceModelInternal } from '@trezor/device-utils';
import type { NetworkSymbol } from '@trezor/network-module';
import type { Branded } from '@trezor/type-utils';

import type { Protocol } from './Protocol';

export type NetworkColor = `#${string}`;
/** Numeric EIP-155 chain identifier used by Ethereum-compatible networks. */
export type NetworkChainId = number & Branded<'NetworkChainId'>;
export type NetworkDisplaySymbol = string & Branded<'NetworkDisplaySymbol'>;

export const asNetworkChainId = (chainId: number): NetworkChainId => chainId as NetworkChainId;
export const asNetworkDisplaySymbol = (displaySymbol: string): NetworkDisplaySymbol =>
    displaySymbol as NetworkDisplaySymbol;

/**
 * This closed union duplicates the set of registered network modules. Adding a network family
 * therefore requires updating this central type even though a family should be introduced simply
 * by registering its module, which prevents network packages from remaining independent.
 *
 * Network-family-specific behavior should instead be owned by the corresponding network module.
 * Consumers should resolve the registered module for a network symbol and use its capabilities
 * rather than branching on a centrally defined family value.
 *
 * @deprecated Use registered network modules instead. This type will be removed after its existing
 * consumers have been migrated to module-based dispatch.
 */
export type NetworkType =
    'bitcoin' | 'ethereum' | 'ripple' | 'cardano' | 'solana' | 'stellar' | 'tron';

// Reserved account types to stand in for a real account type.
type UtilityAccountType = 'normal' | 'imported' | 'placeholder';
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

type BackendOption = {
    readonly type: BackendType;
    // Backend whose nodes run on third-party infrastructure Trezor pays for, not Trezor's own.
    readonly isExternalBackend?: boolean;
};

export type NetworkFeature =
    | 'rbf'
    | 'nfts'
    | 'sign-verify'

    // Network has sub-units (sats, ...) but it is currently used only for sats in case of BTC and
    // testnets, and not used for gwei in case of ETH. It would make sense, but it is not implemented.
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
    readonly accountType: TKey;
    readonly bip43Path: Bip43PathTemplate;
    readonly backendType?: BackendType;
    readonly features?: NetworkFeature[];
    readonly isDebugOnlyAccountType?: boolean;
};

export type NetworkAccount = NetworkAccountWithSpecificKey<AccountType>;

type NetworkAccountTypes = Partial<{
    readonly [key in AccountType]: NetworkAccountWithSpecificKey<key>;
}>;

type NetworkDeviceSupport = Partial<Record<DeviceModelInternal, string>>;

export type SuiteCommonNetworkConfig = {
    /**
     * Points to the base network whose native asset is used by this network. For example,
     * Ethereum L2s set this to `eth` so native-asset metadata and icons resolve to Ethereum.
     */
    readonly settlementLayer?: NetworkSymbol;
    readonly displaySymbol: NetworkDisplaySymbol;
    readonly displaySymbolName?: string;
    readonly name: string;
    readonly networkType: NetworkType;
    readonly bip43Path: Bip43PathTemplate;
    readonly decimals: number;
    readonly testnet: boolean;
    readonly explorer: Explorer;
    readonly accountTypes: NetworkAccountTypes;
    readonly isHidden?: boolean; // Not used here, but supported elsewhere.
    readonly chainId?: NetworkChainId;
    readonly features: NetworkFeature[];
    readonly backendOptions: BackendOption[];
    readonly support?: NetworkDeviceSupport;
    readonly isDebugOnlyNetwork?: boolean;
    readonly isExperimentalOnlyNetwork?: boolean;
    readonly coingeckoId?: string;
    readonly tradeCryptoId?: string;
    readonly caipId?: string; // CAIP-2 chain ID, used by WalletConnect.
    readonly nativeTokenReserve?: string;
    /** Network ID used by Yield.xyz. */
    readonly yieldXyzId: string | null;
    readonly color: NetworkColor;
    readonly protocols: readonly Protocol[];
};
