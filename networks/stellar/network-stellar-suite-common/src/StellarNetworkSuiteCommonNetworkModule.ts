import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { supportedStellarNetworks } from '@trezor/network-stellar/constants';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { getNetworkConfig } from './networkConfig';
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
        addressValidator: stellarValidator,
        walletConnectAdapter: createStellarWalletConnectAdapter(deps),
        getNetworkConfig,
    });
