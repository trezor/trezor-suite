import {
    isSupportedBitcoinNetwork,
    supportedBitcoinNetworks,
    toBitcoinNetworkSymbol,
} from '@trezor/network-bitcoin/constants';
import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module';
import type {
    AddressValidator,
    SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { getNetworkConfig } from './networkConfig';

const supportedNetworks = asNetworkSymbols(supportedBitcoinNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        bitcoinValidator.isAddressValid(address, toBitcoinNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        bitcoinValidator.getAddressType(address, toBitcoinNetworkSymbol(symbol)),
};

const isTestnet = (symbol: NetworkSymbol): boolean =>
    getNetworkConfig(toBitcoinNetworkSymbol(symbol)).testnet;

export const createBitcoinSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedBitcoinNetwork,
    isTestnet,
    getNetworkConfig: symbol => getNetworkConfig(toBitcoinNetworkSymbol(symbol)),
});
