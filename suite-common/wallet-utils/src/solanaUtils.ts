import * as BufferLayout from '@solana/buffer-layout';
import { A, F, pipe } from '@mobily/ts-belt';
import BigNumber from 'bignumber.js';
import type { Transaction } from '@solana/web3.js';

import type { TokenAccount } from '@trezor/blockchain-link-types';
import {
    solanaUtils as SolanaBlockchainLinkUtils,
} from '@trezor/blockchain-link-utils';

import { getLamportsFromSol } from './sendFormUtils';


const {
    TOKEN_PROGRAM_PUBLIC_KEY,
    ASSOCIATED_TOKEN_PROGRAM_PUBLIC_KEY,
    SYSTEM_PROGRAM_PUBLIC_KEY,
 }= SolanaBlockchainLinkUtils;

const loadSolanaLib = async () => {
    const lib = await import('@solana/web3.js');

    return lib;
};

export const getPubKeyFromAddress = async (address: string) => {
    const { PublicKey } = await loadSolanaLib();

    return new PublicKey(address);
};

const encodeTokenTransferInstructionData = (instruction: {
    transferChecked: { amount: BigNumber; decimals: number };
}): Buffer => {
    // To transfer Solana tokens we need to manually encode a buffer with the correct layout
    // according to the instruction standard.
    const LAYOUT = BufferLayout.union(BufferLayout.u8('instruction'));
    LAYOUT.addVariant(
        12,
        BufferLayout.struct([BufferLayout.nu64('amount'), BufferLayout.u8('decimals')]),
        'transferChecked',
    );

    const instructionMaxSpan = Math.max(...Object.values(LAYOUT.registry).map((r: any) => r.span));

    const b = Buffer.alloc(instructionMaxSpan);
    const span = LAYOUT.encode(instruction, b);

    return b.subarray(0, span);
};

type PriorityFees = { computeUnitPrice: string; computeUnitLimit: string };

export const dummyPriorityFeesForFeeEstimation: PriorityFees = {
    computeUnitPrice: '100000',
    computeUnitLimit: '200000',
};

const addPriorityFees = async (transaction: Transaction, priorityFees: PriorityFees) => {
    const { ComputeBudgetProgram } = await loadSolanaLib();
    transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
            units: parseInt(priorityFees.computeUnitLimit, 10),
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: parseInt(priorityFees.computeUnitPrice, 10),
        }),
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
    const { Transaction, SystemProgram, PublicKey } = await loadSolanaLib();
    const transaction = new Transaction({
        blockhash,
        lastValidBlockHeight,
        feePayer: new PublicKey(fromAddress),
    });

    await addPriorityFees(transaction, priorityFees);

    transaction.add(
        SystemProgram.transfer({
            fromPubkey: new PublicKey(fromAddress),
            toPubkey: new PublicKey(toAddress),
            lamports: getLamportsFromSol(amountInSol),
        }),
    );

    return transaction;
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
    const { TransactionInstruction, PublicKey } = await loadSolanaLib();
    // key layout: https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/instruction.rs#L254
    const keys = [
        { pubkey: new PublicKey(from), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(mint), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(to), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(owner), isSigner: true, isWritable: false },
    ];

    return new TransactionInstruction({
        keys,
        data: encodeTokenTransferInstructionData({
            transferChecked: { amount, decimals },
        }),
        programId: new PublicKey(TOKEN_PROGRAM_PUBLIC_KEY),
    });
};

export const getAssociatedTokenAccountAddress = async (
    baseAddress: string,
    tokenMintAddress: string,
) => {
    const { PublicKey } = await loadSolanaLib();

    return PublicKey.findProgramAddressSync(
        [
            new PublicKey(baseAddress).toBuffer(),
            new PublicKey(TOKEN_PROGRAM_PUBLIC_KEY).toBuffer(),
            new PublicKey(tokenMintAddress).toBuffer(),
        ],
        new PublicKey(ASSOCIATED_TOKEN_PROGRAM_PUBLIC_KEY),
    )[0];
};

// Construct an instruction to create an associated token account. Used in token transfers
export const buildCreateAssociatedTokenAccountInstruction = async (
    funderAddress: string,
    newOwnerAddress: string,
    tokenMintAddress: string,
) => {
    const { TransactionInstruction, PublicKey } = await loadSolanaLib();

    const associatedTokenAccountAddress = await getAssociatedTokenAccountAddress(
        newOwnerAddress,
        tokenMintAddress,
    );

    // key layout: https://github.com/solana-labs/solana-program-library/blob/master/associated-token-account/program/src/lib.rs#L58
    const keys = [
        {
            pubkey: new PublicKey(funderAddress),
            isSigner: true,
            isWritable: true,
        },
        {
            pubkey: new PublicKey(associatedTokenAccountAddress),
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: new PublicKey(newOwnerAddress),
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: new PublicKey(tokenMintAddress),
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: new PublicKey(SYSTEM_PROGRAM_PUBLIC_KEY),
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: new PublicKey(TOKEN_PROGRAM_PUBLIC_KEY),
            isSigner: false,
            isWritable: false,
        },
    ];

    const txInstruction = new TransactionInstruction({
        keys,
        programId: new PublicKey(ASSOCIATED_TOKEN_PROGRAM_PUBLIC_KEY),
        data: Buffer.from([]),
    });

    return [txInstruction, associatedTokenAccountAddress] as const;
};

type TokenTransferTxWithDestinationAddress = {
    transaction: Transaction;
    destinationAddress: string;
    tokenAccountInfo?: {
        baseAddress: string;
        tokenProgram: string;
        tokenMint: string;
        tokenAccount: string;
    };
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
    const { Transaction, PublicKey } = await loadSolanaLib();

    const transaction = new Transaction({
        blockhash,
        lastValidBlockHeight,
        feePayer: new PublicKey(fromAddress),
    });

    await addPriorityFees(transaction, priorityFees);

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
            transaction.add(createAccountInstruction);
            finalReceiverAddress = associatedTokenAccountAddress.toString();
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

        // Step 6: Add the token transfer instruction(s) to the transaction
        transaction.add(transferInstruction);

        remainingAmount = remainingAmount.minus(transferAmount);
    });

    await Promise.all(instructionPromises);

    // Step 7: Return the transaction
    return {
        transaction,
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
