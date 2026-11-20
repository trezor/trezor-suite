import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type { SignVerify } from './SignVerify';

/** @serviceContract */
export type SuiteNativeNetworkModule<
    TSuiteCommonNetworkModule extends SuiteCommonNetworkModule = SuiteCommonNetworkModule,
> = {
    getSupportedNetworks: () => readonly NetworkSymbol[];
    getCommon: () => TSuiteCommonNetworkModule;
    signVerify: SignVerify | null;
};
