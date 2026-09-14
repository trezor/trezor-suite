import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module/constants';
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
import { getNetworkConfig } from './networkConfig';

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
    getNetworkConfig: symbol => getNetworkConfig(toTronNetworkSymbol(symbol)),
});
