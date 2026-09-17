import type { NetworkSymbol } from '@trezor/network-module';

import type { SignVerifyModule } from './SignVerifyModule';

export type SuiteNetworkModule = {
    /** `null` for networks that neither sign nor verify messages. */
    signVerify: SignVerifyModule | null;

    getSupportedNetworks: () => readonly NetworkSymbol[];
};
