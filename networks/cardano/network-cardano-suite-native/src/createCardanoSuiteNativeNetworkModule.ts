import {
    type CardanoSuiteCommonNetworkModule,
    type CardanoSuiteCommonNetworkModuleDeps,
    createCardanoSuiteCommonNetworkModule,
} from '@trezor/network-cardano-suite-common';
import { supportedCardanoNetworks } from '@trezor/network-cardano-types';
import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';

export type CardanoSuiteNativeNetworkModuleDeps = CardanoSuiteCommonNetworkModuleDeps;

export type CardanoSuiteNativeNetworkModule =
    SuiteNativeNetworkModule<CardanoSuiteCommonNetworkModule>;

export const createCardanoSuiteNativeNetworkModule = (
    deps: CardanoSuiteNativeNetworkModuleDeps,
): CardanoSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(
        createCardanoSuiteCommonNetworkModule(deps),
        supportedCardanoNetworks,
        {},
    );
