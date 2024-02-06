import { ParsedTransactionWithMeta } from '@solana/web3.js';

import { TokenTransfer, Transaction } from '@trezor/blockchain-link-types/lib';
import { SolanaValidParsedTxWithMeta } from '@trezor/blockchain-link-types/lib/solana';

import {
    extractAccountBalanceDiff,
    getAmount,
    getDetails,
    getTargets,
    getTokens,
    getNativeEffects,
    getTxType,
    transformTransaction,
    getTokenNameAndSymbol,
    transformTokenInfo,
    ApiTokenAccount,
} from '../solana';
import { fixtures } from './fixtures/solana';

describe('solana/utils', () => {
    // Token Utils
    describe('getTokenNameAndSymbol', () => {
        fixtures.getTokenNameAndSymbol.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                expect(getTokenNameAndSymbol(input.mint, input.map)).toEqual(expectedOutput);
            });
        });
    });

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
                const result = getNativeEffects(input.transaction as ParsedTransactionWithMeta);
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
                    input.tokenEffects as TokenTransfer[],
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
                    'sent',
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('getTokens', () => {
        fixtures.getTokens.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = getTokens(
                    input.transaction as ParsedTransactionWithMeta,
                    input.accountAddress,
                    input.map,
                    input.tokenAccountsInfos,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, async () => {
                const result = await transformTransaction(
                    input.transaction as SolanaValidParsedTxWithMeta,
                    input.accountAddress,
                    input.tokenAccountsInfos,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('transformTokenInfo', () => {
        fixtures.transformTokenInfo.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                expect(
                    transformTokenInfo(input.accountInfo as ApiTokenAccount[], input.map),
                ).toEqual(expectedOutput);
            });
        });
    });
});
