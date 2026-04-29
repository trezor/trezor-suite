import { type NetworkSymbol } from '@suite-common/wallet-config';

import { isSymbolSupportingNamedAddress, looksLikeNamedAddress } from '../namedAddressUtils';

describe('isSymbolSupportingNamedAddress', () => {
    it.each(['eth', 'tsep'] as const)('accepts %s', symbol => {
        expect(isSymbolSupportingNamedAddress(symbol)).toBe(true);
    });

    it.each([
        'btc',
        'thod',
        'sol',
        'pol',
        'arb',
        'base',
        'op',
    ] as const satisfies readonly NetworkSymbol[])('rejects %s', symbol => {
        expect(isSymbolSupportingNamedAddress(symbol)).toBe(false);
    });
});

describe('looksLikeNamedAddress', () => {
    it.each([
        ['vitalik.eth'],
        ['foo.box'],
        ['a.b.com'],
        ['  vitalik.eth  '],
        // Two-char last segments are accepted to allow short TLD-style namespaces
        // (e.g. `.io`, `.cz`) — only single-char tails are rejected.
        ['vitalik.io'],
        // Names beginning with `0x` are valid ENS labels — the dot disambiguates them
        // from hex addresses (which never contain a dot).
        ['0xvitalik.eth'],
    ])('accepts %s', value => {
        expect(looksLikeNamedAddress(value)).toBe(true);
    });

    it.each([
        ['', 'empty string'],
        ['   ', 'only whitespace'],
        ['vitalik', 'no dot'],
        ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'hex address'],
        ['vitalik .eth', 'internal whitespace'],
        ['vitalik.', 'zero chars after last dot'],
        ['vitalik.e', 'one char after last dot'],
        ['a.b.c', 'last segment shorter than two chars'],
    ])('rejects %s (%s)', value => {
        expect(looksLikeNamedAddress(value)).toBe(false);
    });
});
