import { SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED, isSolanaError } from '@solana/kit';
import type { Signature } from '@solana/kit';

import { fixtures } from './__fixtures__/connect.fixture';
import {
    buildCreateAssociatedTokenAccountInstruction,
    buildTokenTransferInstruction,
    buildTokenTransferTransaction,
    buildTransferTransaction,
    getLamportsFromSol,
    getMinimumRequiredTokenAccountsForTransfer,
    waitForSignatureConfirmation,
} from './connect';
import type { SolanaAPI } from '../types/common';

const mockSignature = 'mock-signature' as Signature;

const mockApi = (send: jest.Mock, epochInfoSend?: jest.Mock) =>
    ({
        rpc: {
            getSignatureStatuses: jest.fn().mockReturnValue({ send }),
            getEpochInfo: jest.fn().mockReturnValue({
                send: epochInfoSend ?? jest.fn().mockResolvedValue({ blockHeight: 0n }),
            }),
        },
    }) as unknown as SolanaAPI;

const mockLastValidBlockHeight = 100n;

describe('solana utils', () => {
    describe('getMinimumRequiredTokenAccountsForTransfer', () => {
        fixtures.getMinimumRequiredTokenAccountsForTransfer.forEach(
            ({ description, input, expectedOutput }) => {
                it(description, () => {
                    expect(
                        getMinimumRequiredTokenAccountsForTransfer(
                            input.tokenAccounts,
                            input.requiredAmount,
                        ),
                    ).toEqual(expectedOutput);
                });
            },
        );
    });

    describe('getTokenNameAndSymbol', () => {
        fixtures.buildTokenTransferInstruction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const txix = buildTokenTransferInstruction(
                    input.from,
                    input.to,
                    input.owner,
                    input.amount,
                    input.mint,
                    input.decimals,
                    input.tokenProgramName,
                );

                expect(txix.accounts).toEqual(expectedOutput.accounts);
                expect(txix.data).toEqual(expectedOutput.data);
            });
        });
    });

    describe('buildCreateAssociatedTokenAccountInstruction', () => {
        fixtures.buildCreateAssociatedTokenAccountInstruction.forEach(
            ({ description, input, expectedOutput }) => {
                it(description, async () => {
                    const result = await buildCreateAssociatedTokenAccountInstruction(
                        input.funderAddress,
                        input.newOwnerAddress,
                        input.tokenMintAddress,
                        input.tokenProgramName,
                    );
                    const [txix, pubkey] = result;

                    expect(pubkey).toEqual(expectedOutput.pubkey);
                    expect(txix.accounts).toEqual(expectedOutput.accounts);
                    expect(txix.data).toEqual(expectedOutput.data);
                });
            },
        );
    });

    describe('buildTokenTransferTransaction', () => {
        fixtures.buildTokenTransferTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, async () => {
                const tx = await buildTokenTransferTransaction(
                    input.fromAddress,
                    input.toAddress,
                    input.toAddressOwner,
                    input.tokenMint,
                    input.tokenUiAmount,
                    input.tokenDecimals,
                    input.fromTokenAccounts,
                    input.toTokenAccount,
                    input.blockhash,
                    input.lastValidBlockHeight,
                    input.priorityFees,
                    input.tokenProgramName,
                    input.memo,
                );
                const message = tx.transaction.serializeMessage();

                expect(message).toEqual(expectedOutput);
            });
        });
    });

    describe('buildTransferTransaction', () => {
        fixtures.buildTransferTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const tx = buildTransferTransaction(
                    input.fromAddress,
                    input.toAddress,
                    input.amountInSol,
                    input.blockhash,
                    input.lastValidBlockHeight,
                    input.priorityFees,
                    input.memo,
                );
                const message = tx.serializeMessage();

                expect(message).toEqual(expectedOutput);
            });
        });
    });

    it('getLamportsFromSol', () => {
        expect(getLamportsFromSol('1')).toEqual(1000000000n);
        expect(getLamportsFromSol('0.000000001')).toEqual(1n);
    });

    describe('waitForSignatureConfirmation', () => {
        afterEach(() => {
            jest.useRealTimers();
        });

        it('resolves once the signature is confirmed', async () => {
            const send = jest.fn().mockResolvedValue({
                value: [{ confirmationStatus: 'confirmed', err: null }],
            });

            await expect(
                waitForSignatureConfirmation(
                    mockSignature,
                    mockLastValidBlockHeight,
                    mockApi(send),
                ),
            ).resolves.toBeUndefined();
        });

        it('throws a SolanaError when the transaction fails on-chain', async () => {
            const send = jest.fn().mockResolvedValue({
                value: [
                    { confirmationStatus: null, err: { InstructionError: [0, 'GenericError'] } },
                ],
            });

            const error = await waitForSignatureConfirmation(
                mockSignature,
                mockLastValidBlockHeight,
                mockApi(send),
            ).catch(caught => caught);

            expect(isSolanaError(error)).toBe(true);
        });

        it('recovers from a transient RPC error and still confirms on the next poll', async () => {
            jest.useFakeTimers();
            const send = jest
                .fn()
                .mockRejectedValueOnce(new Error('network blip'))
                .mockResolvedValue({ value: [{ confirmationStatus: 'confirmed', err: null }] });

            const resultPromise = waitForSignatureConfirmation(
                mockSignature,
                mockLastValidBlockHeight,
                mockApi(send),
            );

            await jest.advanceTimersByTimeAsync(2_000);

            await expect(resultPromise).resolves.toBeUndefined();
            expect(send).toHaveBeenCalledTimes(2);
        });

        it('rejects with a timeout once the deadline elapses without confirmation or block height exceedance', async () => {
            jest.useFakeTimers();
            const send = jest.fn().mockResolvedValue({
                value: [{ confirmationStatus: 'processed', err: null }],
            });
            const epochInfoSend = jest.fn().mockResolvedValue({ blockHeight: 0n });

            const resultPromise = waitForSignatureConfirmation(
                mockSignature,
                mockLastValidBlockHeight,
                mockApi(send, epochInfoSend),
            );
            resultPromise.catch(() => {
                // Prevent an unhandled rejection warning before the assertion below attaches.
            });

            await jest.advanceTimersByTimeAsync(300_000);

            await expect(resultPromise).rejects.toThrow(
                'Timeout while waiting for the transaction to be confirmed.',
            );
        });

        it('resolves when the transaction confirms between the block-height check and the final poll', async () => {
            const send = jest
                .fn()
                .mockResolvedValueOnce({
                    value: [{ confirmationStatus: 'processed', err: null }],
                })
                .mockResolvedValue({ value: [{ confirmationStatus: 'confirmed', err: null }] });
            const epochInfoSend = jest
                .fn()
                .mockResolvedValue({ blockHeight: mockLastValidBlockHeight + 1n });

            await expect(
                waitForSignatureConfirmation(
                    mockSignature,
                    mockLastValidBlockHeight,
                    mockApi(send, epochInfoSend),
                ),
            ).resolves.toBeUndefined();
            expect(send).toHaveBeenCalledTimes(2);
        });

        it('rejects with a SolanaError once the block height is exceeded without confirmation', async () => {
            jest.useFakeTimers();
            const send = jest.fn().mockResolvedValue({
                value: [{ confirmationStatus: 'processed', err: null }],
            });
            const epochInfoSend = jest
                .fn()
                .mockResolvedValue({ blockHeight: mockLastValidBlockHeight + 1n });

            const resultPromise = waitForSignatureConfirmation(
                mockSignature,
                mockLastValidBlockHeight,
                mockApi(send, epochInfoSend),
            );
            resultPromise.catch(() => {
                // Prevent an unhandled rejection warning before the assertion below attaches.
            });

            await jest.advanceTimersByTimeAsync(60_000);

            const error = await resultPromise.catch(caught => caught);
            expect(isSolanaError(error, SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED)).toBe(true);
        });
    });
});
