import { Transaction } from '@trezor/blockchain-link-types';
import { SolanaValidParsedTxWithMeta } from '@trezor/blockchain-link-types/lib/solana';

import {
    extractAccountBalanceDiff,
    getAmount,
    getDetails,
    getTargets,
    getTransactionEffects,
    getTxType,
    transformTransaction,
} from '../solana';
import { fixtures } from './fixtures/solana';

describe('solana/utils', () => {
    describe('extractAccountBalanceDiff', () => {
        fixtures.extractAccountBalanceDiff.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = extractAccountBalanceDiff(
                    input.transaction as SolanaValidParsedTxWithMeta,
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
                    input.transaction as SolanaValidParsedTxWithMeta,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('getTxType', () => {
        fixtures.getTxType.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = getTxType(
                    input.transaction as SolanaValidParsedTxWithMeta,
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

    describe('getAmount', () => {
        fixtures.getAmount.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = getAmount(input.accountEffect, input.txType as Transaction['type']);
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('getDetails', () => {
        fixtures.getDetails.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = getDetails(
                    input.transaction as SolanaValidParsedTxWithMeta,
                    input.effects,
                    input.accountAddress,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = transformTransaction(
                    input.transaction as SolanaValidParsedTxWithMeta,
                    input.accountAddress,
                    input.slotToBlockHeightMapping as Record<number, number>,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });
});
