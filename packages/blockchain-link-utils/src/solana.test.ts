import { type TokenTransfer, type Transaction } from '@trezor/blockchain-link-types/src';
import { WSOL_MINT } from '@trezor/network-solana/constants';
import type {
    ParsedTransactionWithMeta,
    SolanaValidParsedTxWithMeta,
} from '@trezor/network-solana/types';

import { fixtures } from './__fixtures__/solana';
import {
    type ApiTokenAccount,
    extractAccountBalanceDiff,
    getAmount,
    getDetails,
    getInternalTransfers,
    getNativeEffects,
    getTargets,
    getTokenMetadata,
    getTokenNameAndSymbol,
    getTokens,
    getTxType,
    transformTokenInfo,
    transformTransaction,
} from './solana';

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
                    // @ts-expect-error Fixtures don't fully implement this interface.
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
                const result = getNativeEffects(
                    // @ts-expect-error Fixtures don't fully implement this interface.
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
                    // @ts-expect-error Fixtures don't fully implement this interface.
                    input.transaction as SolanaValidParsedTxWithMeta,
                    // @ts-expect-error Fixtures don't fully implement this interface.
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
                    // @ts-expect-error Fixtures don't fully implement this interface.
                    input.effects,
                    input.txType as Transaction['type'],
                    input.accountAddress,
                    'hasOwnBalanceInternalTransfers' in input
                        ? input.hasOwnBalanceInternalTransfers
                        : false,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('getInternalTransfers', () => {
        fixtures.getInternalTransfers.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = getInternalTransfers(
                    // @ts-expect-error Fixtures don't fully implement this interface.
                    input.transaction,
                    input.effects,
                    input.accountAddress,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('getAmount', () => {
        fixtures.getAmount.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = getAmount(
                    // @ts-expect-error Fixtures don't fully implement this interface.
                    input.accountEffect,
                    input.txType as Transaction['type'],
                );

                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('getDetails', () => {
        fixtures.getDetails.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = getDetails(
                    // @ts-expect-error Fixtures don't fully implement this interface.
                    input.transaction as SolanaValidParsedTxWithMeta,
                    // @ts-expect-error Fixtures don't fully implement this interface.
                    input.effects,
                    input.accountAddress,
                    input.txType,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('getTokens', () => {
        fixtures.getTokens.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = getTokens(
                    // @ts-expect-error Fixtures don't fully implement this interface.
                    input.transaction as ParsedTransactionWithMeta,
                    input.accountAddress,
                    input.map,
                    input.tokenAccountsInfos,
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('getTokens poison-record hardening', () => {
        const accountAddress = 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF';
        const callGetTokens = (transaction: unknown) =>
            getTokens(transaction as ParsedTransactionWithMeta, accountAddress, {}, []);

        it('does not throw when meta.innerInstructions is a truthy non-array', () => {
            const transaction = {
                transaction: { message: { instructions: [] } },
                // a malicious/MITM Solana RPC can return an object here instead of an array;
                // `?.flatMap` optional-chaining does NOT guard against `flatMap is not a function`
                meta: { innerInstructions: {} },
            };
            expect(() => callGetTokens(transaction)).not.toThrow();
            expect(callGetTokens(transaction)).toEqual([]);
        });

        it('does not throw when an innerIx.instructions sub-list is a non-array', () => {
            const transaction = {
                transaction: { message: { instructions: [] } },
                meta: { innerInstructions: [{ index: 0, instructions: 'not-an-array' }] },
            };
            expect(() => callGetTokens(transaction)).not.toThrow();
            expect(callGetTokens(transaction)).toEqual([]);
        });

        it('does not throw when an instruction-list element is a primitive', () => {
            const transaction = {
                // `'parsed' in ix` throws on a primitive element ("Cannot use 'in' operator ...")
                transaction: { message: { instructions: ['poison', 42, null] } },
                meta: { innerInstructions: [] },
            };
            expect(() => callGetTokens(transaction)).not.toThrow();
            expect(callGetTokens(transaction)).toEqual([]);
        });

        it('does not throw when a flattened inner instruction element is a primitive', () => {
            const transaction = {
                transaction: { message: { instructions: [] } },
                meta: { innerInstructions: [{ index: 0, instructions: ['poison'] }] },
            };
            expect(() => callGetTokens(transaction)).not.toThrow();
            expect(callGetTokens(transaction)).toEqual([]);
        });
    });

    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = transformTransaction(
                    // @ts-expect-error Fixtures don't fully implement this interface.
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
                    transformTokenInfo(
                        input.accountInfo as unknown as ApiTokenAccount[],
                        input.map,
                    ),
                ).toEqual(expectedOutput);
            });
        });
    });

    describe('getTokenMetadata', () => {
        const originalFetch = global.fetch;
        const mockFetch = (jsonBody: unknown) => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                statusText: 'OK',
                json: () => Promise.resolve(jsonBody),
            }) as unknown as typeof global.fetch;
        };

        afterEach(() => {
            global.fetch = originalFetch;
        });

        it('coerces a JSON `null` CDN body to a plain object (poison-response DoS)', async () => {
            // The unsigned data.trezor.io CDN is attacker/MITM-controllable; a `null` body must not
            // throw on the `data[WSOL_MINT] = ...` assignment.
            mockFetch(null);
            const result = await getTokenMetadata();
            expect(result).toEqual({ [WSOL_MINT]: { symbol: 'wSOL', name: 'Wrapped SOL' } });
        });

        it('coerces a primitive CDN body to a plain object', async () => {
            mockFetch(42);
            const result = await getTokenMetadata();
            expect(result).toEqual({ [WSOL_MINT]: { symbol: 'wSOL', name: 'Wrapped SOL' } });
        });

        it('passes a valid object body through and always sets wSOL', async () => {
            mockFetch({ someMint: { symbol: 'ABC', name: 'Alpha' } });
            const result = await getTokenMetadata();
            expect(result.someMint).toEqual({ symbol: 'ABC', name: 'Alpha' });
            expect(result[WSOL_MINT]).toEqual({ symbol: 'wSOL', name: 'Wrapped SOL' });
        });
    });
});
