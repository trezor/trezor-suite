import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { stellarAssets } from '@trezor/network-stellar-assets';
import { supportedStellarNetworks } from '@trezor/network-stellar-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import { getStellarTokenLogoAddresses } from './getStellarTokenLogoAddresses';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createStellarSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
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
