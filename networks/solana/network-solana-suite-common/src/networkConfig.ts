import { DeviceModelInternal } from '@trezor/device-utils';
import {
    type Explorer,
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';
import type { SolanaNetworkSymbol } from '@trezor/network-solana/constants';

const getExplorerUrls = (baseUrl: string, isDevnet = false): Explorer => ({
    base: baseUrl,
    tx: `${baseUrl}/tx/`,
    address: `${baseUrl}/account/`,
    queryString: isDevnet ? `?cluster=devnet` : '',
});

type NetworkConfig = SuiteCommonNetworkConfig<SolanaNetworkSymbol> & {
    readonly networkType: 'solana';
};

export const networkConfigBySymbol = {
    sol: {
        color: '#9945ff',
        protocols: [asProtocol('solana'), asProtocol('sol')],
        displaySymbol: 'SOL',
        name: 'Solana',
        networkType: 'solana',
        bip43Path: "m/44'/501'/i'/0'", // phantom - bip44Change
        decimals: 9,
        testnet: false,
        features: ['tokens', 'coin-definitions', 'staking'],
        explorer: getExplorerUrls('https://solscan.io'),
        support: {
            [DeviceModelInternal.T2T1]: '2.6.4',
            [DeviceModelInternal.T2B1]: '2.6.4',
            [DeviceModelInternal.T3B1]: '2.0.0',
            [DeviceModelInternal.T3T1]: '2.0.0',
            [DeviceModelInternal.T3W1]: '2.0.0',
        },
        backendOptions: [{ type: 'solana', isExternalBackend: true }],
        accountTypes: {
            ledger: {
                // bip44Change - Ledger Live
                accountType: 'ledger',
                bip43Path: "m/44'/501'/i'",
                isDebugOnlyAccountType: true,
            },
            root: {
                // root path - single account used by some wallets
                accountType: 'root',
                bip43Path: "m/44'/501'",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: 'solana',
        tradeCryptoId: 'solana',
        caipId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        nativeTokenReserve: '0.003',
        yieldXyzId: 'solana',
    },
    dsol: {
        color: '#9945ff',
        protocols: [asProtocol('dsol')],
        displaySymbol: 'dSOL',
        name: 'Solana Devnet',
        networkType: 'solana',
        bip43Path: "m/44'/501'/i'/0'",
        decimals: 9,
        testnet: true,
        features: ['tokens', 'staking'],
        explorer: getExplorerUrls('https://solscan.io', true),
        support: {
            [DeviceModelInternal.T2T1]: '2.6.4',
            [DeviceModelInternal.T2B1]: '2.6.4',
            [DeviceModelInternal.T3B1]: '2.0.0',
            [DeviceModelInternal.T3T1]: '2.0.0',
            [DeviceModelInternal.T3W1]: '2.0.0',
        },
        backendOptions: [{ type: 'solana', isExternalBackend: true }],
        accountTypes: {
            root: {
                // root path - single account used by some wallets
                accountType: 'root',
                bip43Path: "m/44'/501'",
                isDebugOnlyAccountType: true,
            },
        },
        coingeckoId: undefined,
        tradeCryptoId: undefined,
        caipId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
        yieldXyzId: 'solana-devnet',
    },
} satisfies Readonly<Record<SolanaNetworkSymbol, NetworkConfig>>;

export const getNetworkConfig = (symbol: SolanaNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
