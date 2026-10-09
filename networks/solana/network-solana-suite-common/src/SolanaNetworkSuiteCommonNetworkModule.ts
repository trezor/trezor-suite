import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { solanaAssets } from '@trezor/network-solana-assets';
import { supportedSolanaNetworks } from '@trezor/network-solana-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { createSolanaIcon } from './createSolanaIcon';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createSolanaSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedSolanaNetworks, {
        icon: createSolanaIcon({ solanaAssets }),
        addressValidator: solanaValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
