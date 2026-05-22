import { keccak256, recoverTransactionAddress } from 'viem';

import * as fixtures from '../__fixtures__/ethereumSignTx';
import { serializeEthereumTx } from '../ethereumSignTx';

describe('helpers/ethereumSignTx', () => {
    describe('serializeEthereumTx', () => {
        fixtures.serializeEthereumTx.forEach(f => {
            it(f.description, async () => {
                const isLegacy = f.type === undefined || f.type === 0;
                const serialized = serializeEthereumTx(f.tx, f.signature, isLegacy);

                // Verify signature hash
                const hash = keccak256(serialized);
                expect(hash).toEqual(f.result);

                // Verify by parsing sender address from serialized transaction
                const senderAddress = await recoverTransactionAddress({
                    serializedTransaction: serialized,
                });

                // Compare sender address (based on signature)
                expect(senderAddress.toLowerCase()).toEqual(f.from);
            });
        });
    });
});
