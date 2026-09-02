import { type Protocol } from '@trezor/network-module-suite-common-types';

import { type FindNetworkSymbolForProtocol, type NetworkSymbol } from '../src';

export const mockFindNetworkSymbolForProtocol =
    (
        symbolsByProtocol: Partial<Record<Protocol, NetworkSymbol>> = {},
    ): FindNetworkSymbolForProtocol =>
    protocol =>
        symbolsByProtocol[protocol] ?? null;
