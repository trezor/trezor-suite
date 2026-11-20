import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { solanaAssets } from '@trezor/network-solana-assets';
import { supportedSolanaNetworks } from '@trezor/network-solana-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export type SolanaSuiteCommonNetworkModule = SuiteCommonNetworkModule;

export const createSolanaSuiteCommonNetworkModule = (): SolanaSuiteCommonNetworkModule =>
    createNetworkModule(supportedSolanaNetworks, {
        icon: solanaAssets,
        addressValidator: solanaValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
