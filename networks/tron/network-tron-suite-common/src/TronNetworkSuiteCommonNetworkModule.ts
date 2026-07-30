import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module';
import type {
    AddressValidator,
    SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';
import {
    isSupportedTronNetwork,
    supportedTronNetworks,
    toTronNetworkSymbol,
} from '@trezor/network-tron/constants';

import { tronValidator } from './addressValidator/tronAddressValidator';
import {
    getAccountSyncInterval as getTronAccountSyncInterval,
    getNetworkConfig as getTronNetworkConfig,
} from './networkConfig';

const supportedNetworks = asNetworkSymbols(supportedTronNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        tronValidator.isAddressValid(address, toTronNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        tronValidator.getAddressType(address, toTronNetworkSymbol(symbol)),
};

export const createTronSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedTronNetwork,
    getNetworkConfig: symbol => getTronNetworkConfig(toTronNetworkSymbol(symbol)),
    getAccountSyncInterval: symbol => getTronAccountSyncInterval(toTronNetworkSymbol(symbol)),
});
