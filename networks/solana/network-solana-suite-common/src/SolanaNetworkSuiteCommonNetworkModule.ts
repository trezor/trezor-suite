import type { NetworkModule } from '@trezor/network-module-suite-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import {
    type SolanaNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type SolanaNetworkSuiteCommonNetworkModule = NetworkModule<SolanaNetworkSymbol>;

export const createSolanaSuiteCommonNetworkModule = (): SolanaNetworkSuiteCommonNetworkModule => ({
    addressValidator: solanaValidator,
    getSupportedNetworks,
    isSupportedNetwork,
});
