import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { asNetworkSymbols } from '@trezor/network-module-types';
import { supportedSolanaNetworks } from '@trezor/network-solana-types';

export const createSolanaSuiteNetworkModule = (): SuiteNetworkModule => ({
    signVerify: null,
    getSupportedNetworks: () => asNetworkSymbols(supportedSolanaNetworks),
});
