import {
    isSupportedEthereumNetwork,
    supportedEthereumNetworks,
    toEthereumNetworkSymbol,
} from '@trezor/network-ethereum/constants';
import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module';
import type {
    AddressValidator,
    SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import {
    getAccountSyncInterval as getEthereumAccountSyncInterval,
    getNetworkConfig as getEthereumNetworkConfig,
} from './networkConfig';

const supportedNetworks = asNetworkSymbols(supportedEthereumNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        ethereumValidator.isAddressValid(address, toEthereumNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        ethereumValidator.getAddressType(address, toEthereumNetworkSymbol(symbol)),
};

export const createEthereumSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedEthereumNetwork,
    getNetworkConfig: symbol => getEthereumNetworkConfig(toEthereumNetworkSymbol(symbol)),
    getAccountSyncInterval: symbol =>
        getEthereumAccountSyncInterval(toEthereumNetworkSymbol(symbol)),
});
