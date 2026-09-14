import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module/constants';
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

export const createSolanaSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedSolanaNetwork,
    getNetworkConfig: symbol => getNetworkConfig(toSolanaNetworkSymbol(symbol)),
});
