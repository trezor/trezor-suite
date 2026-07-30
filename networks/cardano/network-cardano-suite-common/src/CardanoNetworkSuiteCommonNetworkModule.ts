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
import {
    getAccountSyncInterval as getCardanoAccountSyncInterval,
    getNetworkConfig as getCardanoNetworkConfig,
} from './networkConfig';

const supportedNetworks = asNetworkSymbols(supportedCardanoNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        adaValidator.isAddressValid(address, toCardanoNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        adaValidator.getAddressType(address, toCardanoNetworkSymbol(symbol)),
};

export const createCardanoSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedCardanoNetwork,
    getNetworkConfig: symbol => getCardanoNetworkConfig(toCardanoNetworkSymbol(symbol)),
    getAccountSyncInterval: symbol => getCardanoAccountSyncInterval(toCardanoNetworkSymbol(symbol)),
});
