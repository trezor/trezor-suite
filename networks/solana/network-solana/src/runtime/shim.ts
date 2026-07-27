import {
    compileTransaction,
    getBase16Codec,
    getBase16Encoder,
    getTransactionDecoder,
    getTransactionEncoder,
    pipe,
} from '@solana/kit';

import type {
    SignatureBytes,
    Transaction,
    TransactionMessage,
    TransactionMessageWithFeePayer,
} from '../types';

const createTransactionShimCommon = (transaction: Transaction) => ({
    addSignature: (signerPubKey: string, signatureHex: string) => {
        if (signerPubKey in transaction.signatures) {
            const signatureBytes = getBase16Codec().encode(signatureHex) as SignatureBytes;
            transaction = Object.freeze({
                ...transaction,
                signatures: Object.freeze({
                    ...transaction.signatures,
                    [signerPubKey]: signatureBytes,
                }),
            });
        }
    },
    serializeMessage: () => getBase16Codec().decode(transaction.messageBytes),
    serialize: () => pipe(transaction, getTransactionEncoder().encode, getBase16Codec().decode),
});

export function createTransactionShim(
    message: TransactionMessage & TransactionMessageWithFeePayer,
) {
    const transaction = compileTransaction(message);

    return createTransactionShimCommon(transaction);
}

export function createTransactionShimFromHex(rawTx: string) {
    const txByteArray = getBase16Encoder().encode(rawTx);
    const transaction = getTransactionDecoder().decode(txByteArray);

    return createTransactionShimCommon(transaction);
}
