import type { NetworkModule } from '@trezor/network-module-suite-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import {
    type EthereumSupportedNetwork,
    getSupportedNetwork,
    isSupportedNetwork,
} from './supportedNetworks';

export type EthereumNetworkModule = NetworkModule<EthereumSupportedNetwork>;

export const createEthereumNetworkModule = (): EthereumNetworkModule => ({
    addressValidator: ethereumValidator,
    getSupportedNetwork,
    isSupportedNetwork,
});
