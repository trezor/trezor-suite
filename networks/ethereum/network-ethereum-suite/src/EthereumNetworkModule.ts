import type { NetworkModule } from '@trezor/network-module-suite-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import { type EthereumSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type EthereumNetworkModule = NetworkModule<EthereumSupportedCoin>;

export const createEthereumNetworkModule = (): EthereumNetworkModule => ({
    addressValidator: ethereumValidator,
    getSupportedCoins,
    isSupportedCoin,
});
