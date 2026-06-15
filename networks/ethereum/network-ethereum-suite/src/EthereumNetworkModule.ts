import type { NetworkModule } from '@trezor/network-module-suite-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import {
    type EthereumNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type EthereumNetworkModule = NetworkModule<EthereumNetworkSymbol>;

export const createEthereumNetworkModule = (): EthereumNetworkModule => ({
    addressValidator: ethereumValidator,
    getSupportedNetworks,
    isSupportedNetwork,
});
