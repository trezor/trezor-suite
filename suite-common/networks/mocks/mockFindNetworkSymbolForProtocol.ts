import type { NetworkSymbol } from '@trezor/network-module';
import { type Protocol } from '@trezor/network-module-suite-common-types';

import { type FindNetworkSymbolForProtocol } from '../src';

export const mockFindNetworkSymbolForProtocol =
    (
        symbolsByProtocol: Partial<Record<Protocol, NetworkSymbol>> = {},
    ): FindNetworkSymbolForProtocol =>
    protocol =>
        symbolsByProtocol[protocol] ?? null;
