import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { supportedSolanaNetworks } from '@trezor/network-solana/constants';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { getNetworkConfig } from './networkConfig';

export const createSolanaSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedSolanaNetworks, {
        addressValidator: solanaValidator,
        getNetworkConfig,
    });
