import { asNetworkSymbols } from '@trezor/network-module';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { supportedSolanaNetworks } from '@trezor/network-solana/constants';

export const createSolanaSuiteNetworkModule = (): SuiteNetworkModule => ({
    signVerify: null,
    getSupportedNetworks: () => asNetworkSymbols(supportedSolanaNetworks),
});
