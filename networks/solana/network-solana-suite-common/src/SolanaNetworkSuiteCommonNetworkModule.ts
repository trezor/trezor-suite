import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { solanaAssets } from '@trezor/network-solana-assets';
import { supportedSolanaNetworks } from '@trezor/network-solana-types';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';
import {
    type SolanaWalletConnectAdapterDeps,
    createSolanaWalletConnectAdapter,
} from './walletConnect/createSolanaWalletConnectAdapter';

type SolanaSuiteCommonNetworkModuleDeps = SolanaWalletConnectAdapterDeps;

type SolanaSuiteCommonNetworkModule = SuiteCommonNetworkModule;

export const createSolanaSuiteCommonNetworkModule = (
    deps: SolanaSuiteCommonNetworkModuleDeps,
): SolanaSuiteCommonNetworkModule =>
    createNetworkModule(supportedSolanaNetworks, {
        icon: solanaAssets,
        addressValidator: solanaValidator,
        walletConnectAdapter: createSolanaWalletConnectAdapter(deps),
        getNetworkConfig,
        getAccountSyncInterval,
    });
