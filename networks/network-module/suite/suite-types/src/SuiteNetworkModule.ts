import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

/** @serviceContract */
export type SuiteNetworkModule<
    TSuiteCommonNetworkModule extends SuiteCommonNetworkModule = SuiteCommonNetworkModule,
> = {
    getSupportedNetworks: () => readonly NetworkSymbol[];
    getCommon: () => TSuiteCommonNetworkModule;
};
