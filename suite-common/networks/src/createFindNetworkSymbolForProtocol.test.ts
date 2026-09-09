import { asProtocol } from '@trezor/network-module-suite-common-types';

import { createFindNetworkSymbolForProtocol } from './createFindNetworkSymbolForProtocol';
import { mockGetNetworkConfig } from '../mocks/mockGetNetworkConfig';

const bitcoinProtocol = asProtocol('bitcoin');
const ethereumProtocol = asProtocol('ethereum');

const findNetworkSymbolForProtocol = createFindNetworkSymbolForProtocol({
    getSupportedNetworks: () => ['btc', 'eth'],
    getNetworkConfig: symbol => ({
        ...mockGetNetworkConfig(symbol),
        protocols: symbol === 'btc' ? [bitcoinProtocol] : [ethereumProtocol],
    }),
});

it('finds the supported network owning a protocol', () => {
    expect(findNetworkSymbolForProtocol(bitcoinProtocol)).toBe('btc');
    expect(findNetworkSymbolForProtocol(ethereumProtocol)).toBe('eth');
});

it('returns null when no supported network owns the protocol', () => {
    expect(findNetworkSymbolForProtocol(asProtocol('unknown'))).toBeNull();
});
