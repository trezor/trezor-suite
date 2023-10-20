import { getLamportsFromSol } from '@suite-common/wallet-utils';

const loadSolanaLib = async () => {
    const lib = await import('@solana/web3.js');

    return lib;
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

export const getPubKeyFromAddress = async (address: string) => {
    const { PublicKey } = await loadSolanaLib();

    return new PublicKey(address);
};
