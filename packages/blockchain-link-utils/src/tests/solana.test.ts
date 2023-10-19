import { ParsedTransactionWithMeta } from '@solana/web3.js';

import { Transaction } from '@trezor/blockchain-link-types';

import { extractAccountBalanceDiff, getTargets, getTransactionEffects, getTxType } from '../solana';
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

    describe('getTxType', () => {
        fixtures.getTxType.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = getTxType(
                    input.transaction as ParsedTransactionWithMeta,
                    input.effects,
                    input.accountAddress,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('getTargets', () => {
        fixtures.getTargets.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = getTargets(
                    input.effects,
                    input.txType as Transaction['type'],
                    input.accountAddress,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });
});
