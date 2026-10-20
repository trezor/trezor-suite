import {
    DEFAULT_ACCOUNT_SYNC_INTERVAL,
    type SuiteCommonNetworkConfig,
    type SuiteCommonNetworkModule,
    asDisplayOrderKey,
} from '@trezor/network-module-suite-common-types';
import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';

export type CustomEvmNetworkConfigParams = {
    chainId: number;
    name: string;
    displaySymbol: string;
    explorerUrl: string;
    testnet: boolean;
};

export type CustomEvmNetworkModuleParams = {
    symbol: NetworkSymbol;
    config: SuiteCommonNetworkConfig;
};

const NEUTRAL_NETWORK_COLOR = '#8a8f98';

// Sorts after every bundled network, whose keys all start with `a`.
const CUSTOM_NETWORK_DISPLAY_ORDER = asDisplayOrderKey('b');

const stripTrailingSlashes = (url: string) => url.replace(/\/+$/, '');

/**
 * Network metadata for a user-added EVM chain served by a plain RPC node, modelled on the
 * bundled RPC-only networks (Arc).
 */
export const buildCustomEvmNetworkConfig = (
    params: CustomEvmNetworkConfigParams,
): SuiteCommonNetworkConfig => {
    const explorerBase = stripTrailingSlashes(params.explorerUrl);

    return {
        color: NEUTRAL_NETWORK_COLOR,
        displayOrder: CUSTOM_NETWORK_DISPLAY_ORDER,
        protocols: [],
        displaySymbol: params.displaySymbol,
        name: params.name,
        networkType: 'ethereum',
        chainId: params.chainId,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: 18,
        testnet: params.testnet,
        explorer: {
            base: explorerBase,
            tx: `${explorerBase}/tx/`,
            address: `${explorerBase}/address/`,
            nft: `${explorerBase}/nft/`,
        },
        features: ['tokens', 'eip1559', 'rbf', 'sign-verify'],
        backendOptions: [{ type: 'evm-rpc', isExternalBackend: true }],
        accountTypes: {},
        caipId: `eip155:${params.chainId}`,
        yieldXyzId: null,
    };
};

// Empty icon sources make the icon components fall back to initials, so a custom chain is never
// shown with another network's logo.
const NO_ICON = { coin: '', network: '' } as const;

/**
 * Network module serving exactly one runtime-registered EVM chain. Addresses are plain
 * Ethereum addresses and there is no bundled icon.
 */
export const createCustomEvmNetworkModule = (
    params: CustomEvmNetworkModuleParams,
): SuiteCommonNetworkModule => ({
    icon: {
        getIcons: () => NO_ICON,
        getIconPaths: () => NO_ICON,
        getTokenLogoIdentifiers: (_symbol, contract) => [contract.toLowerCase()],
    },
    addressValidator: {
        isAddressValid: address => ethereumValidator.isAddressValid(address, 'eth'),
        getAddressType: address => ethereumValidator.getAddressType(address, 'eth'),
    },
    getSupportedNetworks: () => asNetworkSymbols([params.symbol]),
    getNetworkConfig: () => params.config,
    getAccountSyncInterval: () => DEFAULT_ACCOUNT_SYNC_INTERVAL,
});
