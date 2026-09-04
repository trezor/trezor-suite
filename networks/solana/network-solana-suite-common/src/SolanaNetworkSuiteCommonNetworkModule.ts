import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module';
import type {
    AddressValidator,
    SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';
import {
    isSupportedSolanaNetwork,
    supportedSolanaNetworks,
    toSolanaNetworkSymbol,
} from '@trezor/network-solana/constants';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { getNetworkConfig } from './networkConfig';

const supportedNetworks = asNetworkSymbols(supportedSolanaNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        solanaValidator.isAddressValid(address, toSolanaNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        solanaValidator.getAddressType(address, toSolanaNetworkSymbol(symbol)),
};

const isTestnet = (symbol: NetworkSymbol): boolean =>
    getNetworkConfig(toSolanaNetworkSymbol(symbol)).testnet;

export const createSolanaSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedSolanaNetwork,
    isTestnet,
    getNetworkConfig: symbol => getNetworkConfig(toSolanaNetworkSymbol(symbol)),
});
