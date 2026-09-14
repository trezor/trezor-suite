import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import {
    type SolanaNetworkSymbol,
    isSupportedSolanaNetwork,
    supportedSolanaNetworks,
} from '@trezor/network-solana/constants';

export type SolanaSuiteNetworkModule = SuiteNetworkModule<SolanaNetworkSymbol>;

export const createSolanaSuiteNetworkModule = (): SolanaSuiteNetworkModule => ({
    signVerify: null,
    getSupportedNetworks: () => supportedSolanaNetworks,
    isSupportedNetwork: isSupportedSolanaNetwork,
});
