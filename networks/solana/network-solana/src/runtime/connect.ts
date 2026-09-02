import {
    SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
    SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED,
    SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_FAILED_TO_CONNECT,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    SOLANA_ERROR__TRANSACTION_ERROR__BLOCKHASH_NOT_FOUND,
    address,
    appendTransactionMessageInstruction,
    appendTransactionMessageInstructions,
    assertIsFullySignedTransaction,
    assertIsSendableTransaction,
    createNoopSigner,
    createTransactionMessage,
    decompileTransactionMessageFetchingLookupTables,
    getBase16Encoder,
    getCompiledTransactionMessageDecoder,
    getSignatureFromTransaction,
    getTransactionDecoder,
    isSolanaError,
    isTransactionMessageWithDurableNonceLifetime,
    lamports,
    prependTransactionMessageInstructions,
    sendAndConfirmTransactionFactory,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import {
    getSetComputeUnitLimitInstruction,
    getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import { getAddMemoInstruction } from '@solana-program/memo';
import { getTransferSolInstruction } from '@solana-program/system';
import * as splToken from '@solana-program/token';
import * as splToken2022 from '@solana-program/token-2022';

import { BigNumber } from '@trezor/utils';

import { SOLANA_MEMO_MAX_BYTES, SYSTEM_PROGRAM_PUBLIC_KEY, tokenProgramsInfo } from '../constants';
import type {
    Blockhash,
    SolanaAPI,
    TokenProgramName,
    TransactionMessage,
    TransactionMessageWithFeePayer,
} from '../types';
import { createTransactionShim } from './shim';

const getTokenLib = (tokenProgramName: TokenProgramName) =>
    tokenProgramName === 'spl-token' ? splToken : splToken2022;

const validateMemo = (memo: string) => {
    const byteLength = Buffer.from(memo, 'utf8').length;
    if (byteLength > SOLANA_MEMO_MAX_BYTES) {
        throw new Error(
            `Memo exceeds maximum length of ${SOLANA_MEMO_MAX_BYTES} bytes (got ${byteLength})`,
        );
    }
};

export const getLamportsFromSol = (amountInSol: string) =>
    BigInt(new BigNumber(amountInSol).times(10 ** 9).toString());

type PriorityFees = { computeUnitPrice: string; computeUnitLimit: string };

const addPriorityFees = <TMessage extends TransactionMessage>(
    message: TMessage,
    priorityFees: PriorityFees = { computeUnitPrice: '100000', computeUnitLimit: '200000' },
) =>
    prependTransactionMessageInstructions(
        [
            getSetComputeUnitLimitInstruction({
                units: parseInt(priorityFees.computeUnitLimit, 10),
            }),
            getSetComputeUnitPriceInstruction({
                microLamports: parseInt(priorityFees.computeUnitPrice, 10),
            }),
        ],
        message,
    );

export const buildTransferTransaction = (
    fromAddress: string,
    toAddress: string,
    amountInSol: string,
    blockhash: string,
    lastValidBlockHeight: number,
    priorityFees: PriorityFees | undefined,
    memo?: string,
) => {
    const message = setTransactionMessageFeePayer(
        address(fromAddress),
        createTransactionMessage({ version: 'legacy' }),
    );
    const messageWithLifetime = setTransactionMessageLifetimeUsingBlockhash(
        {
            blockhash: blockhash as Blockhash,
            lastValidBlockHeight: BigInt(
                // FIXME: In tests, `lastValidBlockHeight` is sometimes `undefined`.
                lastValidBlockHeight ?? '0xFFFFFFFFFFFFFFFF',
            ),
        },
        message,
    );
    const messageWithTransfer = appendTransactionMessageInstruction(
        getTransferSolInstruction({
            amount: lamports(getLamportsFromSol(amountInSol)),
            destination: address(toAddress),
            source: createNoopSigner(address(fromAddress)),
        }),
        messageWithLifetime,
    );
    let messageWithFees: TransactionMessage & TransactionMessageWithFeePayer = addPriorityFees(
        messageWithTransfer,
        priorityFees,
    );
    if (memo) {
        validateMemo(memo);
        messageWithFees = appendTransactionMessageInstruction(
            getAddMemoInstruction({ memo }),
            messageWithFees,
        );
    }

    return createTransactionShim(messageWithFees);
};

// Construct the transfer instruction for a token transfer
// exported for testing
export const buildTokenTransferInstruction = (
    from: string,
    to: string,
    owner: string,
    amount: BigNumber,
    mint: string,
    decimals: number,
    tokenProgramName: TokenProgramName,
) => {
    const { getTransferCheckedInstruction } = getTokenLib(tokenProgramName);

    return getTransferCheckedInstruction({
        amount: BigInt(amount.toString()),
        authority: createNoopSigner(address(owner)),
        decimals,
        destination: address(to),
        mint: address(mint),
        source: address(from),
    });
};

export const getAssociatedTokenAccountAddress = async (
    baseAddress: string,
    tokenMintAddress: string,
    tokenProgramName: TokenProgramName,
) => {
    const { findAssociatedTokenPda } = getTokenLib(tokenProgramName);

    const [pdaAddress] = await findAssociatedTokenPda({
        mint: address(tokenMintAddress),
        owner: address(baseAddress),
        tokenProgram: address(tokenProgramsInfo[tokenProgramName].publicKey),
    });

    return pdaAddress;
};

// Construct an instruction to create an associated token account. Used in token transfers
export const buildCreateAssociatedTokenAccountInstruction = async (
    funderAddress: string,
    newOwnerAddress: string,
    tokenMintAddress: string,
    tokenProgramName: TokenProgramName,
) => {
    const { getCreateAssociatedTokenInstruction } = getTokenLib(tokenProgramName);

    const associatedTokenAccountAddress = await getAssociatedTokenAccountAddress(
        newOwnerAddress,
        tokenMintAddress,
        tokenProgramName,
    );

    const txInstruction = {
        ...getCreateAssociatedTokenInstruction({
            ata: associatedTokenAccountAddress,
            mint: address(tokenMintAddress),
            owner: address(newOwnerAddress),
            payer: createNoopSigner(address(funderAddress)),
        }),
        // Override data due to FW compatibility issue: expects [] instead of [0]
        data: new Uint8Array([]),
    };

    return [txInstruction, associatedTokenAccountAddress] as const;
};

type TokenTransferTxWithDestinationAddress = {
    transaction: {
        addSignature(signerPubKey: string, signatureHex: string): void;
        serializeMessage(): string;
        serialize(): string;
    };
    destinationAddress: string;
    tokenAccountInfo?: {
        baseAddress: string;
        tokenProgram: string;
        tokenMint: string;
        tokenAccount: string;
    };
};

type TokenAccount = {
    balance: string;
    publicKey: string;
};

// exported for testing
export const getMinimumRequiredTokenAccountsForTransfer = (
    tokenAccounts: TokenAccount[],
    requiredAmount: string,
) => {
    // sort the tokenAccounts from highest to lowest balance
    let accumulatedBalance = new BigNumber('0');
    const sorted = [...tokenAccounts].sort(
        (a, b) => new BigNumber(b.balance).comparedTo(new BigNumber(a.balance)) ?? 0,
    );
    const requiredAccounts: TokenAccount[] = [];
    for (const tokenAccount of sorted) {
        if (accumulatedBalance.gte(requiredAmount)) break;
        accumulatedBalance = accumulatedBalance.plus(tokenAccount.balance);
        requiredAccounts.push(tokenAccount);
    }

    return requiredAccounts;
};

export const buildTokenTransferTransaction = async (
    fromAddress: string,
    toAddress: string,
    toAddressOwner: string,
    tokenMint: string,
    tokenUiAmount: string,
    tokenDecimals: number,
    fromTokenAccounts: TokenAccount[],
    toTokenAccount: TokenAccount | undefined,
    blockhash: string,
    lastValidBlockHeight: number,
    priorityFees: PriorityFees | undefined,
    tokenProgramName: TokenProgramName,
    memo?: string,
): Promise<TokenTransferTxWithDestinationAddress> => {
    const messageBase = setTransactionMessageFeePayer(
        address(fromAddress),
        createTransactionMessage({ version: 'legacy' }),
    );
    const messageWithLifetime = setTransactionMessageLifetimeUsingBlockhash(
        {
            blockhash: blockhash as Blockhash,
            lastValidBlockHeight: BigInt(
                // FIXME: In tests, `lastValidBlockHeight` is sometimes `undefined`.
                lastValidBlockHeight ?? '0xFFFFFFFFFFFFFFFF',
            ),
        },
        messageBase,
    );
    let message: TransactionMessage & TransactionMessageWithFeePayer = addPriorityFees(
        messageWithLifetime,
        priorityFees,
    );

    // Token transaction building logic

    const tokenAmount = new BigNumber(tokenUiAmount).times(10 ** tokenDecimals);

    // Step 1: Select all required token accounts and amounts we need to fulfill the transaction on the user's end
    const requiredAccounts = getMinimumRequiredTokenAccountsForTransfer(
        fromTokenAccounts,
        tokenAmount.toString(),
    );

    // Step 2: Check if the receiver address is a token account
    const isReceiverAddressSystemAccount = toAddressOwner === SYSTEM_PROGRAM_PUBLIC_KEY;

    let finalReceiverAddress = toAddress;
    if (isReceiverAddressSystemAccount) {
        // Step 3: If not, check if the receiver owns an associated token account
        if (toTokenAccount) {
            // If yes, use the first one.
            finalReceiverAddress = toTokenAccount.publicKey;
        } else {
            // Step 4: If not, create an associated token account for the receiver
            const [createAccountInstruction, associatedTokenAccountAddress] =
                await buildCreateAssociatedTokenAccountInstruction(
                    fromAddress,
                    toAddress,
                    tokenMint,
                    tokenProgramName,
                );

            // Add the account creation instruction to the transaction and use the newly created associated token account as the receiver
            message = appendTransactionMessageInstruction(createAccountInstruction, message);
            finalReceiverAddress = associatedTokenAccountAddress;
        }
    }

    // Step 5: Build the token transfer instruction(s)
    let remainingAmount = tokenAmount;
    const instructionPromises = requiredAccounts.map(tokenAccount => {
        const transferAmount = BigNumber.min(remainingAmount, new BigNumber(tokenAccount.balance));

        const transferInstruction = buildTokenTransferInstruction(
            tokenAccount.publicKey,
            finalReceiverAddress,
            fromAddress,
            transferAmount,
            tokenMint,
            tokenDecimals,
            tokenProgramName,
        );

        remainingAmount = remainingAmount.minus(transferAmount);

        return transferInstruction;
    });

    // Step 6: Add the token transfer instruction(s) to the transaction
    message = appendTransactionMessageInstructions(await Promise.all(instructionPromises), message);

    // Step 7: Append memo instruction if provided
    if (memo) {
        validateMemo(memo);
        message = appendTransactionMessageInstruction(getAddMemoInstruction({ memo }), message);
    }

    // Step 8: Return the transaction
    return {
        transaction: createTransactionShim(message),
        destinationAddress: finalReceiverAddress,
        tokenAccountInfo: isReceiverAddressSystemAccount
            ? {
                  baseAddress: toAddress,
                  tokenProgram: tokenProgramsInfo[tokenProgramName].publicKey,
                  tokenMint,
                  tokenAccount: finalReceiverAddress,
              }
            : undefined,
    };
};

const preparePushTransaction = async (rawTx: string, api: SolanaAPI) => {
    const txByteArray = getBase16Encoder().encode(rawTx);
    const transaction = getTransactionDecoder().decode(txByteArray);
    assertIsFullySignedTransaction(transaction);
    assertIsSendableTransaction(transaction);

    const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
    const message = await decompileTransactionMessageFetchingLookupTables(compiledMessage, api.rpc);
    if (isTransactionMessageWithDurableNonceLifetime(message)) {
        // TODO: Handle durable nonce transactions.
        throw new Error('Unimplemented: Confirming durable nonce transactions');
    }

    // If lifetimeConstraint is not provided, fetch the latest blockhash and lastValidBlockHeight
    const lifetimeConstraint =
        message.lifetimeConstraint ??
        (await api.rpc
            .getLatestBlockhash({ commitment: 'confirmed' })
            .send()
            .then(({ value: { blockhash, lastValidBlockHeight } }) => ({
                blockhash,
                lastValidBlockHeight,
            })));

    return { ...transaction, lifetimeConstraint };
};

const getSendErrorMessage = (error: any) => {
    if (isSolanaError(error, SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED)) {
        return 'Please make sure that you submit the transaction within 1 minute after signing.';
    }
    if (
        isSolanaError(error, SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_FAILED_TO_CONNECT) ||
        isSolanaError(error, SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED) ||
        isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR)
    ) {
        return 'Solana backend connection failure. The backend might be inaccessible or the connection is unstable.';
    }
    if (
        isSolanaError(
            error,
            SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
        ) &&
        isSolanaError(error.cause, SOLANA_ERROR__TRANSACTION_ERROR__BLOCKHASH_NOT_FOUND)
    ) {
        return 'The transaction has expired because too much time passed between signing and sending. Please try again.';
    }
    if (isSolanaError(error)) {
        return `Solana error code: ${error.context.__code}. Please try again or contact support.`;
    }
};

export const sendAndConfirmTransaction = async (rawTx: string, api: SolanaAPI) => {
    const transaction = await preparePushTransaction(rawTx, api);

    try {
        const signature = getSignatureFromTransaction(transaction);
        const send = sendAndConfirmTransactionFactory(api);
        await send(transaction, { commitment: 'confirmed', skipPreflight: false });

        return signature;
    } catch (error) {
        const errorMessage = getSendErrorMessage(error);
        if (errorMessage) {
            throw new Error(errorMessage, { cause: error });
        }
        throw error;
    }
};
