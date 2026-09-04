import type { NetworkSymbol } from '@trezor/network-module';

import type { GetSupportedNetworks } from '../src/createGetSupportedNetworks';

export const mockGetSupportedNetworks =
    (supportedNetworks: readonly NetworkSymbol[] = []): GetSupportedNetworks =>
    () =>
        supportedNetworks;
