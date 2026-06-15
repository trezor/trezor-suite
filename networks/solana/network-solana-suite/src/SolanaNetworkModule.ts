import type { NetworkModule } from '@trezor/network-module-suite-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import {
    type SolanaNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type SolanaNetworkModule = NetworkModule<SolanaNetworkSymbol>;

export const createSolanaNetworkModule = (): SolanaNetworkModule => ({
    addressValidator: solanaValidator,
    getSupportedNetworks,
    isSupportedNetwork,
});
