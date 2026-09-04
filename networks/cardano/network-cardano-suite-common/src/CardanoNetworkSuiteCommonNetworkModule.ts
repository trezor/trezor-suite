import {
    isSupportedCardanoNetwork,
    supportedCardanoNetworks,
    toCardanoNetworkSymbol,
} from '@trezor/network-cardano/constants';
import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module';
import type {
    AddressValidator,
    SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { getNetworkConfig } from './networkConfig';

const supportedNetworks = asNetworkSymbols(supportedCardanoNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        adaValidator.isAddressValid(address, toCardanoNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        adaValidator.getAddressType(address, toCardanoNetworkSymbol(symbol)),
};

const isTestnet = (symbol: NetworkSymbol): boolean =>
    getNetworkConfig(toCardanoNetworkSymbol(symbol)).testnet;

export const createCardanoSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedCardanoNetwork,
    isTestnet,
    getNetworkConfig: symbol => getNetworkConfig(toCardanoNetworkSymbol(symbol)),
});
