import type { NetworkModule } from '@network-module/suite-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';

export type EthereumNetworkModule = NetworkModule;

export const createEthereumNetworkModule = (): EthereumNetworkModule => ({
    addressValidator: ethereumValidator,
});
