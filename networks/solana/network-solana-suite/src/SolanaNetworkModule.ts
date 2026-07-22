import type { NetworkModule } from '@trezor/network-module-suite-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import {
    type SolanaSupportedNetwork,
    getSupportedNetwork,
    isSupportedNetwork,
} from './supportedNetworks';

export type SolanaNetworkModule = NetworkModule<SolanaSupportedNetwork>;

export const createSolanaNetworkModule = (): SolanaNetworkModule => ({
    addressValidator: solanaValidator,
    getSupportedNetwork,
    isSupportedNetwork,
});
