import { serializedV1Tx, v1Message } from './__fixtures__/signing.fixture';
import { createTransactionShimFromHex } from './shim';

const feePayer = 'GcUy7n96V4CLEupSJGAd2KbkR2bpmEfrBxpCzqy4Sfcr';
const signature = 'ab'.repeat(64);

describe(createTransactionShimFromHex.name, () => {
    // v1 puts the signatures after the message, without a length prefix.
    it('adds the signature after the message of a v1 transaction', () => {
        const tx = createTransactionShimFromHex(serializedV1Tx);

        expect(tx.serializeMessage()).toBe(v1Message);

        tx.addSignature(feePayer, signature);

        expect(tx.serialize()).toBe(`${v1Message}${signature}`);
    });
});
