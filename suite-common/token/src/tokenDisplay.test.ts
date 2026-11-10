import { getTokenDisplayName, getTokenDisplaySymbol, truncateTokenSymbol } from './tokenDisplay';

describe('truncateTokenSymbol', () => {
    it('shortens a long symbol', () => {
        expect(truncateTokenSymbol('LONGTOKENSYMBOL')).toBe('LONGTOKENS...');
    });

    it('keeps a short symbol', () => {
        expect(truncateTokenSymbol('USDC')).toBe('USDC');
    });

    it('keeps a URL whole so it is still masked', () => {
        expect(truncateTokenSymbol('claim-at-scamsite.io')).toBe('claim-at-scamsite.io');
    });
});

describe('getTokenDisplaySymbol', () => {
    it('uppercases a symbol', () => {
        expect(getTokenDisplaySymbol({ symbol: 'usdc' })).toBe('USDC');
    });

    it('preserves the case of a standard with case-sensitive symbols', () => {
        expect(getTokenDisplaySymbol({ symbol: 'yUSDC', standard: 'STELLAR-CLASSIC' })).toBe(
            'yUSDC',
        );
    });

    it('truncates only on request', () => {
        expect(getTokenDisplaySymbol({ symbol: 'LONGTOKENSYMBOL' })).toBe('LONGTOKENSYMBOL');
        expect(getTokenDisplaySymbol({ symbol: 'LONGTOKENSYMBOL' }, { isTruncated: true })).toBe(
            'LONGTOKENS...',
        );
    });

    it('returns null for a token without a symbol', () => {
        expect(getTokenDisplaySymbol({ symbol: '' })).toBeNull();
        expect(getTokenDisplaySymbol(null)).toBeNull();
    });
});

describe('getTokenDisplayName', () => {
    it('prefers the name', () => {
        expect(getTokenDisplayName({ name: 'USD Coin', symbol: 'USDC' })).toBe('USD Coin');
    });

    it('falls back to the symbol', () => {
        expect(getTokenDisplayName({ name: '', symbol: 'USDC' })).toBe('USDC');
    });

    it('returns null for a token with neither', () => {
        expect(getTokenDisplayName({})).toBeNull();
        expect(getTokenDisplayName(undefined)).toBeNull();
    });
});
