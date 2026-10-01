import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { supportedSolanaNetworks } from '@trezor/network-solana/constants';

import { solanaValidator } from './addressValidator/solanaAddressValidator';
import { getNetworkConfig } from './networkConfig';
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
        addressValidator: solanaValidator,
        walletConnectAdapter: createSolanaWalletConnectAdapter(deps),
        getNetworkConfig,
    });
