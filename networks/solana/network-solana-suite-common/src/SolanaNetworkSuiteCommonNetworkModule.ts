import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { supportedSolanaNetworks } from '@trezor/network-solana/constants';

import { solanaIcon } from '../icons';
import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createSolanaSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedSolanaNetworks, {
        icon: solanaIcon,
        addressValidator: solanaValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
