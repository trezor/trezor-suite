import { getTokenDisplayName, getTokenDisplaySymbol, truncateTokenSymbol } from './tokenDisplay';

describe('truncateTokenSymbol', () => {
    it.each([
        {
            description: 'shortens a long symbol',
            symbol: 'LONGTOKENSYMBOL',
            expected: 'LONGTOKENS...',
        },
        { description: 'keeps a short symbol', symbol: 'USDC', expected: 'USDC' },
        {
            description: 'keeps a URL whole so it is still masked',
            symbol: 'claim-at-scamsite.io',
            expected: 'claim-at-scamsite.io',
        },
    ])('$description', ({ symbol, expected }) => {
        expect(truncateTokenSymbol(symbol)).toBe(expected);
    });
});

describe('getTokenDisplaySymbol', () => {
    it.each([
        { description: 'uppercases a symbol', token: { symbol: 'usdc' }, expected: 'USDC' },
        {
            description: 'preserves the case of a standard with case-sensitive symbols',
            token: { symbol: 'yUSDC', standard: 'STELLAR-CLASSIC' },
            expected: 'yUSDC',
        },
        {
            description: 'keeps a long symbol whole by default',
            token: { symbol: 'LONGTOKENSYMBOL' },
            expected: 'LONGTOKENSYMBOL',
        },
        {
            description: 'truncates a long symbol on request',
            token: { symbol: 'LONGTOKENSYMBOL' },
            options: { isTruncated: true },
            expected: 'LONGTOKENS...',
        },
        { description: 'returns null for an empty symbol', token: { symbol: '' }, expected: null },
        { description: 'returns null for a missing token', token: null, expected: null },
    ] as const)('$description', ({ token, options, expected }) => {
        expect(getTokenDisplaySymbol(token, options)).toBe(expected);
    });
});

describe('getTokenDisplayName', () => {
    it.each([
        {
            description: 'prefers the name',
            token: { name: 'USD Coin', symbol: 'USDC' },
            expected: 'USD Coin',
        },
        {
            description: 'falls back to the symbol',
            token: { name: '', symbol: 'USDC' },
            expected: 'USDC',
        },
        { description: 'returns null for a token with neither', token: {}, expected: null },
        { description: 'returns null for a missing token', token: undefined, expected: null },
    ])('$description', ({ token, expected }) => {
        expect(getTokenDisplayName(token)).toBe(expected);
    });
});
