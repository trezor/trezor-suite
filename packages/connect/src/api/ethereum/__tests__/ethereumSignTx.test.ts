import { TransactionFactory } from '@ethereumjs/tx';
import { keccak256, toHex } from 'web3-utils';

import { serializeEthereumTx } from '../ethereumSignTx';
import * as fixtures from '../__fixtures__/ethereumSignTx';

describe('helpers/ethereumSignTx', () => {
    describe('serializeEthereumTx', () => {
        fixtures.serializeEthereumTx.forEach(f => {
            it(f.description, () => {
                const isLegacy = f.type === undefined || f.type === 0;
                const serialized = serializeEthereumTx(f.tx, f.signature, isLegacy);

                // Verify signature hash
                const hash = toHex(
                    keccak256(Uint8Array.from(Buffer.from(serialized.slice(2), 'hex'))),
                );
                expect(hash).toEqual(f.result);

                // Verify by parsing the serialized tx
                const tx = TransactionFactory.fromSerializedData(
                    Buffer.from(serialized.slice(2), 'hex'),
                );
                const hash2 = Buffer.from(tx.hash()).toString('hex');
                expect(`0x${hash2}`).toEqual(f.result);

                // Compare sender address (based on signature)
                expect(tx.getSenderAddress().toString()).toEqual(f.from);
            });
        });
    });
});
