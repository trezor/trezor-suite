import { A, F, pipe } from '@mobily/ts-belt';
import {
    type SignatureBytes,
    type Blockhash,
    type CompilableTransactionMessage,
    type TransactionMessage,
} from '@solana/web3.js';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import type { TokenAccount } from '@trezor/blockchain-link-types';
import { solanaUtils as SolanaBlockchainLinkUtils } from '@trezor/blockchain-link-utils';

import { getLamportsFromSol } from './sendFormUtils';

const { TOKEN_PROGRAM_PUBLIC_KEY, SYSTEM_PROGRAM_PUBLIC_KEY } = SolanaBlockchainLinkUtils;

const loadSolanaLib = async () => {
    return await import('@solana/web3.js');
};
const loadSolanaComputeBudgetProgramLib = async () => {
    return await import('@solana-program/compute-budget');
};
const loadSolanaSystemProgramLib = async () => {
    return await import('@solana-program/system');
};
const loadSolanaTokenProgramLib = async () => {
    return await import('@solana-program/token');
};

type PriorityFees = { computeUnitPrice: string; computeUnitLimit: string };

export const dummyPriorityFeesForFeeEstimation: PriorityFees = {
    computeUnitPrice: '100000',
    computeUnitLimit: '200000',
};

async function createTransactionShim(message: CompilableTransactionMessage) {
    const { compileTransaction, getBase16Codec, getTransactionEncoder } = await loadSolanaLib();

    let transaction = compileTransaction(message);

    return {
        addSignature(signerPubKey: string, signatureHex: string) {
            if (signerPubKey in transaction.signatures) {
                const signatureBytes = getBase16Codec().encode(signatureHex) as SignatureBytes;
                // Currently there's no public interface for adding a signature manually
                transaction = Object.freeze({
                    ...transaction,
                    signatures: Object.freeze({
                        ...transaction.signatures,
                        [signerPubKey]: signatureBytes,
                    }),
                });
            }
        },
        serializeMessage() {
            return getBase16Codec().decode(transaction.messageBytes);
        },
        serialize() {
            return pipe(transaction, getTransactionEncoder().encode, getBase16Codec().decode);
        },
    };
}

const addPriorityFees = async <TMessage extends TransactionMessage>(
    message: TMessage,
    priorityFees: PriorityFees,
) => {
    const [
        // @solana/web3.js
        { prependTransactionMessageInstructions },
        // @solana-program/compute-budget
        { getSetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction },
    ] = await Promise.all([loadSolanaLib(), loadSolanaComputeBudgetProgramLib()]);

    return pipe(message, m =>
        prependTransactionMessageInstructions(
            [
                getSetComputeUnitLimitInstruction({
                    units: parseInt(priorityFees.computeUnitLimit, 10),
                }),
                getSetComputeUnitPriceInstruction({
                    microLamports: parseInt(priorityFees.computeUnitPrice, 10),
                }),
            ],
            m,
        ),
    );
};

export const buildTransferTransaction = async (
    fromAddress: string,
    toAddress: string,
    amountInSol: string,
    blockhash: string,
    lastValidBlockHeight: number,
    priorityFees: PriorityFees,
) => {
    const [
        // @solana/web3.js
        {
            address,
            appendTransactionMessageInstruction,
            createTransactionMessage,
            lamports,
            setTransactionMessageLifetimeUsingBlockhash,
            setTransactionMessageFeePayer,
            createNoopSigner,
        },
        // @solana-program/system
        { getTransferSolInstruction },
    ] = await Promise.all([loadSolanaLib(), loadSolanaSystemProgramLib()]);
    const message = await pipe(
        createTransactionMessage({ version: 'legacy' }),
        m => setTransactionMessageFeePayer(address(fromAddress), m),
        m =>
            setTransactionMessageLifetimeUsingBlockhash(
                {
                    blockhash: blockhash as Blockhash,
                    lastValidBlockHeight: BigInt(
                        // FIXME: In tests, `lastValidBlockHeight` is sometimes `undefined`.
                        lastValidBlockHeight ?? '0xFFFFFFFFFFFFFFFF',
                    ),
                },
                m,
            ),
        m =>
            appendTransactionMessageInstruction(
                getTransferSolInstruction({
                    amount: lamports(getLamportsFromSol(amountInSol)),
                    destination: address(toAddress),
                    source: createNoopSigner(address(fromAddress)),
                }),
                m,
            ),
        m => addPriorityFees(m, priorityFees),
    );

    return await createTransactionShim(message);
};

// Construct the transfer instruction for a token transfer
// exported for testing
export const buildTokenTransferInstruction = async (
    from: string,
    to: string,
    owner: string,
    amount: BigNumber,
    mint: string,
    decimals: number,
) => {
    const [
        // @solana/web3.js
        { address, createNoopSigner },
        // @solana-program/token
        { getTransferCheckedInstruction },
    ] = await Promise.all([loadSolanaLib(), loadSolanaTokenProgramLib()]);

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
) => {
    const [
        // @solana/web3.js
        { address },
        // @solana-program/token
        { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS },
    ] = await Promise.all([loadSolanaLib(), loadSolanaTokenProgramLib()]);

    const [pdaAddress] = await findAssociatedTokenPda({
        mint: address(tokenMintAddress),
        owner: address(baseAddress),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    return pdaAddress;
};

// Construct an instruction to create an associated token account. Used in token transfers
export const buildCreateAssociatedTokenAccountInstruction = async (
    funderAddress: string,
    newOwnerAddress: string,
    tokenMintAddress: string,
) => {
    const [
        // @solana/web3.js
        { address, createNoopSigner },
        // @solana-program/token
        { getCreateAssociatedTokenInstruction },
    ] = await Promise.all([loadSolanaLib(), loadSolanaTokenProgramLib()]);

    const associatedTokenAccountAddress = await getAssociatedTokenAccountAddress(
        newOwnerAddress,
        tokenMintAddress,
    );

    const txInstruction = getCreateAssociatedTokenInstruction({
        ata: associatedTokenAccountAddress,
        mint: address(tokenMintAddress),
        owner: address(newOwnerAddress),
        payer: createNoopSigner(address(funderAddress)),
    });
    // @ts-expect-error - we are overriding this due to FW compatibility issue, it expects [] instead of [0]
    txInstruction.data = new Uint8Array([]);

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

// exported for testing
export const getMinimumRequiredTokenAccountsForTransfer = (
    tokenAccounts: TokenAccount[],
    requiredAmount: string,
) => {
    // sort the tokenAccounts from highest to lowest balance
    let accumulatedBalance = new BigNumber('0');
    const requiredAccounts = F.toMutable(
        pipe(
            tokenAccounts,
            A.sort((a, b) => new BigNumber(b.balance).comparedTo(new BigNumber(a.balance))),
            A.takeWhile(tokenAccount => {
                const needMoreAccounts = accumulatedBalance.lt(requiredAmount);
                accumulatedBalance = accumulatedBalance.plus(tokenAccount.balance);

                return needMoreAccounts;
            }),
        ),
    );

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
    priorityFees: PriorityFees,
): Promise<TokenTransferTxWithDestinationAddress> => {
    const {
        address,
        appendTransactionMessageInstruction,
        appendTransactionMessageInstructions,
        createTransactionMessage,
        setTransactionMessageFeePayer,
        setTransactionMessageLifetimeUsingBlockhash,
    } = await loadSolanaLib();

    let message = await pipe(
        createTransactionMessage({ version: 'legacy' }),
        m => setTransactionMessageFeePayer(address(fromAddress), m),
        m =>
            setTransactionMessageLifetimeUsingBlockhash(
                {
                    blockhash: blockhash as Blockhash,
                    lastValidBlockHeight: BigInt(
                        // FIXME: In tests, `lastValidBlockHeight` is sometimes `undefined`.
                        lastValidBlockHeight ?? '0xFFFFFFFFFFFFFFFF',
                    ),
                },
                m,
            ),
        m => addPriorityFees(m, priorityFees),
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
                );

            // Add the account creation instruction to the transaction and use the newly created associated token account as the receiver
            message = appendTransactionMessageInstruction(createAccountInstruction, message);
            finalReceiverAddress = associatedTokenAccountAddress;
        }
    }

    // Step 5: Build the token transfer instruction(s)
    let remainingAmount = tokenAmount;
    const instructionPromises = requiredAccounts.map(async tokenAccount => {
        const transferAmount = BigNumber.min(remainingAmount, new BigNumber(tokenAccount.balance));

        const transferInstruction = await buildTokenTransferInstruction(
            tokenAccount.publicKey,
            finalReceiverAddress,
            fromAddress,
            transferAmount,
            tokenMint,
            tokenDecimals,
        );

        remainingAmount = remainingAmount.minus(transferAmount);

        return transferInstruction;
    });

    // Step 6: Add the token transfer instruction(s) to the transaction
    message = appendTransactionMessageInstructions(await Promise.all(instructionPromises), message);

    // Step 7: Return the transaction
    return {
        transaction: await createTransactionShim(message),
        destinationAddress: finalReceiverAddress,
        tokenAccountInfo: isReceiverAddressSystemAccount
            ? {
                  baseAddress: toAddress,
                  tokenProgram: TOKEN_PROGRAM_PUBLIC_KEY,
                  tokenMint,
                  tokenAccount: finalReceiverAddress,
              }
            : undefined,
    };
};
