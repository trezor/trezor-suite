import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { stellarAssets } from '@trezor/network-stellar-assets';
import { supportedStellarNetworks } from '@trezor/network-stellar-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { getStellarTokenLogoAddresses } from './getStellarTokenLogoAddresses';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';
import {
    type StellarWalletConnectAdapterDeps,
    createStellarWalletConnectAdapter,
} from './walletConnect/createStellarWalletConnectAdapter';

type StellarSuiteCommonNetworkModuleDeps = StellarWalletConnectAdapterDeps;

type StellarSuiteCommonNetworkModule = SuiteCommonNetworkModule;

export const createStellarSuiteCommonNetworkModule = (
    deps: StellarSuiteCommonNetworkModuleDeps,
): StellarSuiteCommonNetworkModule =>
    createNetworkModule(supportedStellarNetworks, {
        icon: {
            ...stellarAssets,
            getTokenLogoIdentifiers: (symbol, contract) =>
                symbol === 'xlm' ? getStellarTokenLogoAddresses(contract) : [contract],
        },
        addressValidator: stellarValidator,
        walletConnectAdapter: createStellarWalletConnectAdapter(deps),
        getNetworkConfig,
        getAccountSyncInterval,
    });
