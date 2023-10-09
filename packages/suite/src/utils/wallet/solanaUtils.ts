import * as BufferLayout from '@solana/buffer-layout';
import { getLamportsFromSol } from '@suite-common/wallet-utils';

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
