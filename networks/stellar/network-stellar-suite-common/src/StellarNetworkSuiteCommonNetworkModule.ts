import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module';
import type {
    AddressValidator,
    SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';
import {
    isSupportedStellarNetwork,
    supportedStellarNetworks,
    toStellarNetworkSymbol,
} from '@trezor/network-stellar/constants';

import { stellarValidator } from './addressValidator/stellarAddressValidator';
import {
    getAccountSyncInterval as getStellarAccountSyncInterval,
    getNetworkConfig as getStellarNetworkConfig,
} from './networkConfig';

const supportedNetworks = asNetworkSymbols(supportedStellarNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        stellarValidator.isAddressValid(address, toStellarNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        stellarValidator.getAddressType(address, toStellarNetworkSymbol(symbol)),
};

export const createStellarSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedStellarNetwork,
    getNetworkConfig: symbol => getStellarNetworkConfig(toStellarNetworkSymbol(symbol)),
    getAccountSyncInterval: symbol => getStellarAccountSyncInterval(toStellarNetworkSymbol(symbol)),
});
