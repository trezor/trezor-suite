import type { NetworkModule } from '@network-module/suite-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';

export const createSolanaNetworkModule = (): NetworkModule => ({
    addressValidator: solanaValidator,
});
