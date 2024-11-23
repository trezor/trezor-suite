import { fixtures } from '../__fixtures__/solanaUtils';
import {
    buildCreateAssociatedTokenAccountInstruction,
    buildTokenTransferInstruction,
    buildTokenTransferTransaction,
    getMinimumRequiredTokenAccountsForTransfer,
} from '../solanaUtils';

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
            it(description, async () => {
                const txix = await buildTokenTransferInstruction(
                    input.from,
                    input.to,
                    input.owner,
                    input.amount,
                    input.mint,
                    input.decimals,
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
                    const [txix, pubkey] = await buildCreateAssociatedTokenAccountInstruction(
                        input.funderAddress,
                        input.newOwnerAddress,
                        input.tokenMintAddress,
                    );

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
                );
                const message = tx.transaction.serializeMessage();

                expect(message).toEqual(expectedOutput);
            });
        });
    });
});
