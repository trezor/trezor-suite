import type { NetworkSymbol } from '../src/NetworkModules';
import type { GetSupportedNetworks } from '../src/createGetSupportedNetworks';

export const mockGetSupportedNetworks =
    (supportedNetworks: readonly NetworkSymbol[] = []): GetSupportedNetworks =>
    () =>
        supportedNetworks;
