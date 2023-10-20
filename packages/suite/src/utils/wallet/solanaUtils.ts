import * as BufferLayout from '@solana/buffer-layout';
import type { TokenAccount } from '@trezor/blockchain-link-types';
import { A, F, pipe } from '@mobily/ts-belt';
import { getLamportsFromSol } from '@suite-common/wallet-utils';
import {
    TOKEN_PROGRAM_PUBLIC_KEY,
    ASSOCIATED_TOKEN_PROGRAM_PUBLIC_KEY,
    SYSTEM_PROGRAM_PUBLIC_KEY,
    SYSVAR_RENT_PUBLIC_KEY,
} from '@trezor/blockchain-link-utils/lib/solana';
import BigNumber from 'bignumber.js';

const loadSolanaLib = async () => {
    const lib = await import('@solana/web3.js');

    return lib;
};

export const getPubKeyFromAddress = async (address: string) => {
    const { PublicKey } = await loadSolanaLib();

    return new PublicKey(address);
};

// To transfer Solana tokens we need to manually encode a buffer with the correct layout
// according to the instruction standard.
const LAYOUT = BufferLayout.union(BufferLayout.u8('instruction'));
LAYOUT.addVariant(
    12,
    BufferLayout.struct([BufferLayout.nu64('amount'), BufferLayout.u8('decimals')]),
    'transferChecked',
);

const instructionMaxSpan = Math.max(...Object.values(LAYOUT.registry).map((r: any) => r.span));

const encodeTokenTransferInstructionData = (instruction: {
    transferChecked: { amount: BigNumber; decimals: number };
}): Buffer => {
    const b = Buffer.alloc(instructionMaxSpan);
    const span = LAYOUT.encode(instruction, b);

    return b.subarray(0, span);
};

export const buildTransferTransaction = async (
    fromAddress: string,
    toAddress: string,
    amountInSol: string,
    blockhash: string,
    lastValidBlockHeight: number,
) => {
    const { Transaction, SystemProgram, PublicKey } = await loadSolanaLib();
    const transaction = new Transaction({
        blockhash,
        lastValidBlockHeight,
        feePayer: new PublicKey(fromAddress),
    }).add(
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

// Construct an instruction to create an associated token account. Used in token transfers
export const buildCreateAssociatedTokenAccountInstruction = async (
    funderAddress: string,
    newOwnerAddress: string,
    tokenMintAddress: string,
) => {
    const { TransactionInstruction, PublicKey } = await loadSolanaLib();

    const associatedTokenAccountAddress = PublicKey.findProgramAddressSync(
        [
            new PublicKey(newOwnerAddress).toBuffer(),
            new PublicKey(TOKEN_PROGRAM_PUBLIC_KEY).toBuffer(),
            new PublicKey(tokenMintAddress).toBuffer(),
        ],
        new PublicKey(ASSOCIATED_TOKEN_PROGRAM_PUBLIC_KEY),
    )[0];

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
        {
            pubkey: new PublicKey(SYSVAR_RENT_PUBLIC_KEY),
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
