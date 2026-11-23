import { type NetworkModule, createNetworkModule } from '@trezor/network-module-suite-common-types';
import { stellarAssets } from '@trezor/network-stellar-assets';
import { type StellarNetworkSymbol, supportedStellarNetworks } from '@trezor/network-stellar-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { getStellarTokenLogoAddresses } from './getStellarTokenLogoAddresses';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export type StellarSuiteCommonNetworkModule = NetworkModule<StellarNetworkSymbol>;

export const createStellarSuiteCommonNetworkModule = (): StellarSuiteCommonNetworkModule =>
    createNetworkModule(supportedStellarNetworks, {
        icon: {
            ...stellarAssets,
            getTokenLogoIdentifiers: (symbol, contract) =>
                symbol === 'xlm' ? getStellarTokenLogoAddresses(contract) : [contract],
        },
        addressValidator: stellarValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
