import { ParsedTransactionWithMeta } from '@solana/web3.js';

import { extractAccountBalanceDiff, getTransactionEffects } from '../solana';
import { fixtures } from './fixtures/solana';

describe('solana/utils', () => {
    describe('extractAccountBalanceDiff', () => {
        fixtures.extractAccountBalanceDiff.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = extractAccountBalanceDiff(
                    input.transaction as ParsedTransactionWithMeta,
                    input.address,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('getTransactionEffects', () => {
        fixtures.getTransactionEffects.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = getTransactionEffects(
                    input.transaction as ParsedTransactionWithMeta,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });
});
