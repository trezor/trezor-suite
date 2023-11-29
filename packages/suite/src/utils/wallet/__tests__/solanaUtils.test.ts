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

                const keys = txix.keys.map(key => ({ ...key, pubkey: key.pubkey.toString() }));

                expect(keys).toEqual(expectedOutput.keys);
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

                    const keys = txix.keys.map(key => ({ ...key, pubkey: key.pubkey.toString() }));

                    expect(pubkey.toString()).toEqual(expectedOutput.pubkey);
                    expect(keys).toEqual(expectedOutput.keys);
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
                    input.toTokenAccounts,
                    input.blockhash,
                    input.lastValidBlockHeight,
                );
                const message = tx.transaction.compileMessage().serialize().toString('hex');

                expect(message).toEqual(expectedOutput);
            });
        });
    });
});
