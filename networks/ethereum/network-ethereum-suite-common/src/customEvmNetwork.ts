import {
    DEFAULT_ACCOUNT_SYNC_INTERVAL,
    type SuiteCommonNetworkConfig,
    type SuiteCommonNetworkModule,
    asDisplayOrderKey,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { removeTrailingSlashes } from '@trezor/utils';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import { type EthereumSignVerifyDeps } from './signVerify/createEthereumSignVerify';
import { createSignEthereumMessage } from './signVerify/createSignEthereumMessage';
import { createVerifyEthereumMessage } from './signVerify/createVerifyEthereumMessage';

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

export type CustomEvmNetworkModuleDeps = EthereumSignVerifyDeps;

const NEUTRAL_NETWORK_COLOR = '#8a8f98';

// Custom networks are limited to chains whose native currency uses the Ether denomination.
export const EVM_NATIVE_CURRENCY_DECIMALS = 18;

// Sorts after every predefined network, whose keys all start with `a`.
const CUSTOM_NETWORK_DISPLAY_ORDER = asDisplayOrderKey('b');

/**
 * Network metadata for a user-added EVM chain served by a plain RPC node, modelled on the
 * predefined RPC-only networks (Arc).
 */
export const buildCustomEvmNetworkConfig = (
    params: CustomEvmNetworkConfigParams,
): SuiteCommonNetworkConfig => {
    // Params also come from storage, which the type cannot vouch for.
    if (typeof params.explorerUrl !== 'string' || !params.explorerUrl) {
        throw new Error(`Custom network ${params.chainId} has no explorer URL`);
    }
    // Explorer links are rendered as hrefs, so a `javascript:` or similar scheme must never get in.
    if (!/^https?:\/\//i.test(params.explorerUrl)) {
        throw new Error(`Custom network ${params.chainId} has a non-HTTP explorer URL`);
    }

    const explorerBase = removeTrailingSlashes(params.explorerUrl);

    return {
        color: NEUTRAL_NETWORK_COLOR,
        displayOrder: CUSTOM_NETWORK_DISPLAY_ORDER,
        protocols: [],
        displaySymbol: params.displaySymbol,
        name: params.name,
        networkType: 'ethereum',
        chainId: params.chainId,
        bip43Path: "m/44'/60'/0'/0/i",
        decimals: EVM_NATIVE_CURRENCY_DECIMALS,
        testnet: params.testnet,
        explorer: {
            base: explorerBase,
            tx: `${explorerBase}/tx/`,
            address: `${explorerBase}/address/`,
            nft: `${explorerBase}/nft/`,
        },
        features: ['tokens', 'eip1559', 'rbf', 'sign-verify'],
        backendOptions: [{ type: 'evm-rpc' }],
        accountTypes: {
            ledger: {
                // ledger (live), #1 acc is same as Trezor, so it is skipped
                accountType: 'ledger',
                bip43Path: "m/44'/60'/i'/0/0",
                isDebugOnlyAccountType: true,
            },
            legacy: {
                // ledger (legacy)
                accountType: 'legacy',
                bip43Path: "m/44'/60'/0'/i",
                isDebugOnlyAccountType: true,
            },
        },
        caipId: `eip155:${params.chainId}`,
        yieldXyzId: null,
    };
};

// Empty icon sources make the icon components fall back to initials, so a custom chain is never
// shown with another network's logo.
const NO_ICON = { coin: '', network: '' } as const;

/**
 * Network module serving exactly one runtime-registered EVM chain. Addresses are plain
 * Ethereum addresses, messages are signed like on any Ethereum network and there is no bundled
 * icon.
 */
export type CustomEvmNetworkModule = (
    params: CustomEvmNetworkModuleParams,
) => SuiteCommonNetworkModule;

export const createCustomEvmNetworkModule = (
    deps: CustomEvmNetworkModuleDeps,
): CustomEvmNetworkModule => {
    const signEthereumMessage = createSignEthereumMessage(deps);
    const verifyEthereumMessage = createVerifyEthereumMessage(deps);

    return params =>
        createNetworkModule([params.symbol], {
            icon: {
                getIcons: () => NO_ICON,
                getIconPaths: () => NO_ICON,
                getTokenLogoIdentifiers: (_symbol, contract) => [contract.toLowerCase()],
            },
            addressValidator: {
                isAddressValid: (_symbol, address) =>
                    ethereumValidator.isAddressValid('eth', address),
                getAddressType: (_symbol, address) =>
                    ethereumValidator.getAddressType('eth', address),
            },
            getNetworkConfig: () => params.config,
            getAccountSyncInterval: () => DEFAULT_ACCOUNT_SYNC_INTERVAL,
            signVerify: {
                signMessage: (_symbol, signParams) => signEthereumMessage(signParams),
                verifyMessage: (_symbol, verifyParams) => verifyEthereumMessage(verifyParams),
            },
        });
};
