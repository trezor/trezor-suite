import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';
import { SolanaComposeTransaction as SolanaComposeTransactionSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { SYSTEM_PROGRAM_PUBLIC_KEY } from '@trezor/network-solana/constants';
import solana from '@trezor/network-solana/runtime';
import { Assert } from '@trezor/schema-utils';

import { assertBackendSupported, initBlockchain } from '../../../backend/BlockchainLink';
import type { MethodContext, MethodMessage, MethodReturnType } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../../../data/coinInfo';

type SolanaComposeTransactionParams = SolanaComposeTransactionSchema & {
    coinInfo: CoinInfo;
};

export default class SolanaComposeTransaction extends AbstractMethod<
    'solanaComposeTransaction',
    SolanaComposeTransactionParams
> {
    constructor(message: MethodMessage<'solanaComposeTransaction'>) {
        const { payload } = message;

        // validate bundle type
        Assert(SolanaComposeTransactionSchema, payload);

        const coinInfo = getCoinInfoOrThrow(payload.coin || 'sol');
        // validate backend
        assertBackendSupported(coinInfo);

        const params = { coinInfo, ...payload };

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    get info() {
        return 'Compose Solana transaction';
    }

    async run({
        sendCoreMessage,
    }: MethodContext): Promise<MethodReturnType<'solanaComposeTransaction'>> {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );

        // If serializedTx is provided, preserve token metadata for the signing step so
        // firmware can resolve known SPL tokens instead of displaying a raw address.
        if (this.params.serializedTx) {
            const { token, toAddress } = this.params;
            let tokenAccountInfo;

            if (token && toAddress) {
                try {
                    const { getDecompiledMessage, getSolanaTokenAccountInfos } = await solana();
                    const decompiledMessage = getDecompiledMessage(this.params.serializedTx, true);

                    if (decompiledMessage) {
                        [tokenAccountInfo] = await getSolanaTokenAccountInfos({
                            baseAddress: toAddress,
                            instructions: decompiledMessage.message.instructions,
                            tokenMint: token.mint,
                        });
                    }
                } catch {
                    // Transaction metadata is optional and may require address lookup tables.
                }
            }

            return {
                serializedTx: this.params.serializedTx,
                additionalInfo: tokenAccountInfo ? { tokenAccountInfo } : {},
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

        const { token, toAddress } = this.params;
        const [recipientAccountOwner, recipientTokenAccounts] = token
            ? await backend.getAccountInfo({ descriptor: toAddress }).then(accountInfo =>
                  // Fetch data about recipient account owner if this is a token transfer
                  // We need this in order to validate the address and ensure transfers go through
                  !accountInfo
                      ? ([undefined, undefined] as const)
                      : getAssociatedTokenAccountAddress(toAddress, token.mint, token.program).then(
                            associatedTokenAccount => {
                                const accountOwner = accountInfo?.misc?.owner;
                                const tokenInfo = accountInfo?.tokens
                                    ?.find(t => t.contract === token.mint)
                                    ?.accounts?.find(
                                        account =>
                                            associatedTokenAccount.toString() === account.publicKey,
                                    );

                                return [accountOwner, tokenInfo] as const;
                            },
                        ),
              )
            : [undefined, undefined];

        const tokenTransferTxAndDestinationAddress = this.params.token?.accounts
            ? await buildTokenTransferTransaction(
                  this.params.fromAddress,
                  this.params.toAddress,
                  recipientAccountOwner || SYSTEM_PROGRAM_PUBLIC_KEY, // toAddressOwner
                  this.params.token.mint,
                  this.params.amount || '0',
                  this.params.token.decimals,
                  this.params.token.accounts,
                  recipientTokenAccounts,
                  this.params.blockHash,
                  this.params.lastValidBlockHeight,
                  this.params.priorityFees,
                  this.params.token.program,
                  this.params.memo,
              )
            : undefined;

        if (this.params.token && !tokenTransferTxAndDestinationAddress)
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
            this.params.token &&
            recipientTokenAccounts === undefined &&
            // if the recipient account has no owner, it means it's a new account and needs the token account to be created
            (recipientAccountOwner === SYSTEM_PROGRAM_PUBLIC_KEY || recipientAccountOwner == null);
        const newAccountProgramName = isCreatingAccount ? this.params.token?.program : undefined;

        return {
            serializedTx: tx.serialize(),
            additionalInfo: {
                newAccountProgramName,
                tokenAccountInfo: tokenTransferTxAndDestinationAddress?.tokenAccountInfo,
            },
        };
    }
}
