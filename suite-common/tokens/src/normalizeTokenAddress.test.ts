import { asNetworkSymbol } from '@trezor/network-module-types';

import { normalizeTokenAddress } from './normalizeTokenAddress';

describe('normalizeTokenAddress', () => {
    const evmAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

    it.each(['eth', 'arb', 'base', 'tsep'])('normalizes EVM addresses on %s', network => {
        expect(normalizeTokenAddress(asNetworkSymbol(network), evmAddress)).toBe(
            evmAddress.toLowerCase(),
        );
    });

    it.each(['sol', 'ada', 'xlm'])('preserves case on %s, even for EVM-shaped strings', network => {
        expect(normalizeTokenAddress(asNetworkSymbol(network), evmAddress)).toBe(evmAddress);
    });

    it('keeps distinct Cardano assets under the same policy separate', () => {
        const policy = 'a'.repeat(56);
        const first = `${policy}416c706861`;
        const second = `${policy}42657461`;

        expect(normalizeTokenAddress(asNetworkSymbol('ada'), first)).toBe(first);
        expect(normalizeTokenAddress(asNetworkSymbol('ada'), first)).not.toBe(
            normalizeTokenAddress(asNetworkSymbol('ada'), second),
        );
    });
});
