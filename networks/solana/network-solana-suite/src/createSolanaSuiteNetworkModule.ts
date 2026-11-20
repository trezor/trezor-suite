import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';
import {
    type SolanaSuiteCommonNetworkModule,
    createSolanaSuiteCommonNetworkModule,
} from '@trezor/network-solana-suite-common';
import { supportedSolanaNetworks } from '@trezor/network-solana-types';

export type SolanaSuiteNetworkModule = SuiteNetworkModule<SolanaSuiteCommonNetworkModule>;

export const createSolanaSuiteNetworkModule = (): SolanaSuiteNetworkModule =>
    createNetworkModuleSuite(createSolanaSuiteCommonNetworkModule(), supportedSolanaNetworks, {});
