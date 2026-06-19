import type { NetworkModule } from '@network-module/suite-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';

export type SolanaNetworkModule = NetworkModule;

export const createSolanaNetworkModule = (): SolanaNetworkModule => ({
    addressValidator: solanaValidator,
});
