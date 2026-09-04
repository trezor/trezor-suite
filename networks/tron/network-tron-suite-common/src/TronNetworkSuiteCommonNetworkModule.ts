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
import { getNetworkConfig } from './networkConfig';

const supportedNetworks = asNetworkSymbols(supportedTronNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        tronValidator.isAddressValid(address, toTronNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        tronValidator.getAddressType(address, toTronNetworkSymbol(symbol)),
};

const isTestnet = (symbol: NetworkSymbol): boolean =>
    getNetworkConfig(toTronNetworkSymbol(symbol)).testnet;

export const createTronSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedTronNetwork,
    isTestnet,
    getNetworkConfig: symbol => getNetworkConfig(toTronNetworkSymbol(symbol)),
});
