import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import {
    type SolanaNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type SolanaNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<SolanaNetworkSymbol>;

export const createSolanaSuiteCommonNetworkModule = (): SolanaNetworkSuiteCommonNetworkModule => ({
    addressValidator: solanaValidator,
    getSupportedNetworks,
    isSupportedNetwork,
});
