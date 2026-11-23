import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

/** @serviceContract */
export type SuiteNativeNetworkModule<TSuiteCommonNetworkModule = SuiteCommonNetworkModule> = {
    getSupportedNetworks: () => readonly NetworkSymbol[];
    getCommon: () => TSuiteCommonNetworkModule;
};
