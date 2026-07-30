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
import {
    getAccountSyncInterval as getRippleAccountSyncInterval,
    getNetworkConfig as getRippleNetworkConfig,
} from './networkConfig';

const supportedNetworks = asNetworkSymbols(supportedRippleNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        rippleValidator.isAddressValid(address, toRippleNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        rippleValidator.getAddressType(address, toRippleNetworkSymbol(symbol)),
};

export const createRippleSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedRippleNetwork,
    getNetworkConfig: symbol => getRippleNetworkConfig(toRippleNetworkSymbol(symbol)),
    getAccountSyncInterval: symbol => getRippleAccountSyncInterval(toRippleNetworkSymbol(symbol)),
});
