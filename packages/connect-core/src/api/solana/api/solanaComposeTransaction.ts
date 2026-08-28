import type { PermissionRequest } from '@trezor/connect-common';
import { SolanaComposeTransaction as SolanaComposeTransactionSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { SYSTEM_PROGRAM_PUBLIC_KEY, tokenProgramsInfo } from '@trezor/network-solana/constants';
import solana from '@trezor/network-solana/runtime';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';

export default class SolanaComposeTransaction extends AbstractMethod<
    'solanaComposeTransaction',
    SolanaComposeTransactionSchema
> {
    constructor(message: MethodMessage<'solanaComposeTransaction'>) {
        const { payload } = message;

        // validate bundle type
        Assert(SolanaComposeTransactionSchema, payload);

        const params = { ...payload };

        super(message, params);
        this.useDevice = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    get info() {
        return 'Compose Solana transaction';
    }

    async run() {
        // If serializedTx is provided, preserve token metadata for the signing step so
        // firmware can display the recipient's base address instead of the token account.
        if (this.params.serializedTx) {
            const { tokenTransfer, toAddress } = this.params;
            let tokenAccountInfo;

            if (tokenTransfer && toAddress) {
                try {
                    const { getDecompiledMessage } = await solana();
                    const decompiledMessage = getDecompiledMessage(this.params.serializedTx, true);
                    const tokenTransferInstruction = decompiledMessage?.instructions.find(
                        instruction => instruction.type === 'transfer-checked',
                    );

                    if (tokenTransferInstruction) {
                        tokenAccountInfo = {
                            baseAddress: toAddress,
                            tokenProgram: tokenProgramsInfo[tokenTransfer.program].publicKey,
                            tokenMint: tokenTransferInstruction.parsed.accounts.mint.address,
                            tokenAccount:
                                tokenTransferInstruction.parsed.accounts.destination.address,
                        };
                    }
                } catch {
                    // without token metadata the device falls back to showing the token account
                }
            }

            return {
                serializedTx: this.params.serializedTx,
                additionalInfo: { tokenAccountInfo },
            };
        }

        if (!this.params.toAddress) {
            throw ERRORS.TypedError('Method_InvalidParameter', 'toAddress not found');
        }

        const {
            getAssociatedTokenAccountAddress,
            buildTokenTransferTransaction,
            buildTransferTransaction,
        } = await solana();

        const { tokenTransfer, toAddress } = this.params;

        let recipientTokenAccount;
        if (tokenTransfer) {
            const associatedTokenAccount = await getAssociatedTokenAccountAddress(
                toAddress,
                tokenTransfer.mint,
                tokenTransfer.program,
            );
            recipientTokenAccount = tokenTransfer.recipientTokenAccounts.find(
                account => associatedTokenAccount.toString() === account.publicKey,
            );
        }

        const tokenTransferTxAndDestinationAddress = this.params.tokenTransfer?.accounts
            ? await buildTokenTransferTransaction(
                  this.params.fromAddress,
                  this.params.toAddress,
                  tokenTransfer?.recipientAccountOwner || SYSTEM_PROGRAM_PUBLIC_KEY, // toAddressOwner
                  this.params.tokenTransfer.mint,
                  this.params.amount || '0',
                  this.params.tokenTransfer.decimals,
                  this.params.tokenTransfer.accounts,
                  recipientTokenAccount,
                  this.params.blockHash,
                  this.params.lastValidBlockHeight,
                  this.params.priorityFees,
                  this.params.tokenTransfer.program,
                  this.params.memo,
              )
            : undefined;

        if (this.params.tokenTransfer && !tokenTransferTxAndDestinationAddress)
            throw ERRORS.TypedError('Method_InvalidParameter', 'Token accounts not found');

        const tx = tokenTransferTxAndDestinationAddress
            ? tokenTransferTxAndDestinationAddress.transaction
            : buildTransferTransaction(
                  this.params.fromAddress,
                  this.params.toAddress,
                  this.params.amount,
                  this.params.blockHash,
                  this.params.lastValidBlockHeight,
                  this.params.priorityFees,
                  this.params.memo,
              );

        const isCreatingAccount =
            tokenTransfer &&
            recipientTokenAccount === undefined &&
            // if the recipient account has no owner, it means it's a new account and needs the token account to be created
            (tokenTransfer.recipientAccountOwner === SYSTEM_PROGRAM_PUBLIC_KEY ||
                tokenTransfer.recipientAccountOwner == null);
        const newAccountProgramName = isCreatingAccount ? tokenTransfer?.program : undefined;

        return {
            serializedTx: tx.serialize(),
            additionalInfo: {
                newAccountProgramName,
                tokenAccountInfo: tokenTransferTxAndDestinationAddress?.tokenAccountInfo,
            },
        };
    }
}
