import { bitcoinAssets } from '@trezor/network-bitcoin-assets';
import { supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';
import {
    type BitcoinWalletConnectAdapterDeps,
    createBitcoinWalletConnectAdapter,
} from './walletConnect/createBitcoinWalletConnectAdapter';

type BitcoinSuiteCommonNetworkModuleDeps = BitcoinWalletConnectAdapterDeps;

type BitcoinSuiteCommonNetworkModule = SuiteCommonNetworkModule;

export const createBitcoinSuiteCommonNetworkModule = (
    deps: BitcoinSuiteCommonNetworkModuleDeps,
): BitcoinSuiteCommonNetworkModule =>
    createNetworkModule(supportedBitcoinNetworks, {
        icon: bitcoinAssets,
        addressValidator: bitcoinValidator,
        walletConnectAdapter: createBitcoinWalletConnectAdapter(deps),
        getNetworkConfig,
        getAccountSyncInterval,
    });
