import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import {
    type SolanaNetworkSymbol,
    isSupportedSolanaNetwork,
    supportedSolanaNetworks,
} from '@trezor/network-solana/constants';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { getNetworkConfig } from './networkConfig';

export type SolanaNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<SolanaNetworkSymbol>;

const isTestnet = (symbol: SolanaNetworkSymbol): boolean => getNetworkConfig(symbol).testnet;

export const createSolanaSuiteCommonNetworkModule = (): SolanaNetworkSuiteCommonNetworkModule => ({
    addressValidator: solanaValidator,
    getSupportedNetworks: () => supportedSolanaNetworks,
    isSupportedNetwork: isSupportedSolanaNetwork,
    isTestnet,
    getNetworkConfig,
});
