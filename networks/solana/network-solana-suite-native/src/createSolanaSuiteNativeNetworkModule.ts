import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';
import {
    type SolanaSuiteCommonNetworkModule,
    createSolanaSuiteCommonNetworkModule,
} from '@trezor/network-solana-suite-common';
import { supportedSolanaNetworks } from '@trezor/network-solana-types';

export type SolanaSuiteNativeNetworkModule =
    SuiteNativeNetworkModule<SolanaSuiteCommonNetworkModule>;

export const createSolanaSuiteNativeNetworkModule = (): SolanaSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(
        createSolanaSuiteCommonNetworkModule(),
        supportedSolanaNetworks,
        {},
    );
