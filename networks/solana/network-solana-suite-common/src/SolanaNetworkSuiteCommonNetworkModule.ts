import { type NetworkModule, createNetworkModule } from '@trezor/network-module-suite-common-types';
import { solanaAssets } from '@trezor/network-solana-assets';
import { type SolanaNetworkSymbol, supportedSolanaNetworks } from '@trezor/network-solana-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export type SolanaSuiteCommonNetworkModule = NetworkModule<SolanaNetworkSymbol>;

export const createSolanaSuiteCommonNetworkModule = (): SolanaSuiteCommonNetworkModule =>
    createNetworkModule(supportedSolanaNetworks, {
        icon: solanaAssets,
        addressValidator: solanaValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
