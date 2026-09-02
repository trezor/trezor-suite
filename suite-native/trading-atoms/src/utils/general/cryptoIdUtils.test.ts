import type { CryptoId } from 'invity-api';

import { toCaseAwareCryptoId } from './cryptoIdUtils';

describe('cryptoIdUtils', () => {
    describe('toCaseAwareCryptoId', () => {
        it.each<[string, CryptoId]>([
            ['bitcoin', 'bitcoin' as CryptoId],
            ['ethereum', 'ethereum' as CryptoId],
            [
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'ethereum--0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48' as CryptoId,
            ],
            [
                'base--0x0000000000000000000000000000000000000000',
                'base--0x0000000000000000000000000000000000000000' as CryptoId,
            ],
            [
                'solana--JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
                'solana--JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as CryptoId,
            ],
        ])('should return %s for %s', (expectedValue, cryptoId) => {
            expect(toCaseAwareCryptoId(cryptoId)).toBe(expectedValue);
        });
    });
});
