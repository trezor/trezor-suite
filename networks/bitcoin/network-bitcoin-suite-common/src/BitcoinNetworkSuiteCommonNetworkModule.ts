import { supportedBitcoinNetworks } from '@trezor/network-bitcoin/constants';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { getNetworkConfig } from './networkConfig';
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
        addressValidator: bitcoinValidator,
        walletConnectAdapter: createBitcoinWalletConnectAdapter(deps),
        getNetworkConfig,
    });
