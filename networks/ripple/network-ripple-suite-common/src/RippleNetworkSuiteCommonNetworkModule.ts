import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module';
import type {
    AddressValidator,
    SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';
import {
    isSupportedRippleNetwork,
    supportedRippleNetworks,
    toRippleNetworkSymbol,
} from '@trezor/network-ripple/constants';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import { getNetworkConfig } from './networkConfig';

const supportedNetworks = asNetworkSymbols(supportedRippleNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        rippleValidator.isAddressValid(address, toRippleNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        rippleValidator.getAddressType(address, toRippleNetworkSymbol(symbol)),
};

const isTestnet = (symbol: NetworkSymbol): boolean =>
    getNetworkConfig(toRippleNetworkSymbol(symbol)).testnet;

export const createRippleSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedRippleNetwork,
    isTestnet,
    getNetworkConfig: symbol => getNetworkConfig(toRippleNetworkSymbol(symbol)),
});
