import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';

import { isAddressLike, isNameLike, supportsNamedAddress } from './namedAddressUtils';

describe('supportsNamedAddress', () => {
    it.each(['eth', 'tsep'] as const)('accepts %s', symbol => {
        expect(supportsNamedAddress(symbol)).toBe(true);
    });

    it.each([
        'thod',
        'pol',
        'arb',
        'base',
        'op',
    ] as const satisfies readonly EthereumNetworkSymbol[])('rejects %s', symbol => {
        expect(supportsNamedAddress(symbol)).toBe(false);
    });
});

describe('isNameLike', () => {
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
        // The rule only constrains what follows the last dot, so a bare tail qualifies too.
        // Deliberate: the resolver is the authority on what exists, and single-label names
        // like `a.eth` are registrable, so no minimum is imposed on the leading label.
        ['.eth'],
    ])('accepts %s', value => {
        expect(isNameLike(value)).toBe(true);
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
        expect(isNameLike(value)).toBe(false);
    });
});

describe('isAddressLike', () => {
    it.each([
        ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'checksummed'],
        ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 'lowercase'],
        ['0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045', 'uppercase'],
        ['  0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045  ', 'surrounded by whitespace'],
    ])('accepts %s (%s)', value => {
        expect(isAddressLike(value)).toBe(true);
    });

    it.each([
        ['', 'empty string'],
        ['vitalik.eth', 'ENS name'],
        ['d8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'missing 0x prefix'],
        ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA9604', 'one character too short'],
        ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA960455', 'one character too long'],
        ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA9604g', 'non-hex character'],
    ])('rejects %s (%s)', value => {
        expect(isAddressLike(value)).toBe(false);
    });
});
