import { Transaction } from '@trezor/utxo-lib';

import { BITCOIN_NETWORK } from '../src/bitcoin/bitcoinNetwork';

export type MockPreviousTransactionOutput = {
    script: Buffer;
    value: string;
};

export type MockPreviousTransactionParams = {
    outputs: MockPreviousTransactionOutput[];
    /** Varies the funding input so that otherwise equal transactions get different ids. */
    nonce?: number;
};

/** A serialized transaction with the given outputs, spending an arbitrary earlier output. */
export const mockPreviousTransaction = ({ outputs, nonce = 0 }: MockPreviousTransactionParams) => {
    const transaction = new Transaction({ network: BITCOIN_NETWORK });
    const fundingHash = Buffer.alloc(32, 0x11);
    fundingHash.writeUInt32LE(nonce, 0);

    transaction.ins.push({
        hash: fundingHash,
        index: 0,
        script: Buffer.from('483045', 'hex'),
        sequence: 0xffffffff,
        witness: [],
    });
    outputs.forEach(({ script, value }) => transaction.outs.push({ script, value }));

    return { hex: transaction.toHex(), txid: transaction.getId() };
};
