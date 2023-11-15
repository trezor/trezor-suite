import { Transaction } from '@ethereumjs/tx';
import { sha3 } from 'web3-utils';

import { serializeEthereumTx } from '../ethereumSignTx';

import * as fixtures from '../__fixtures__/ethereumSignTx';

describe('helpers/ethereumSignTx', () => {
    describe('serializeEthereumTx', () => {
        fixtures.serializeEthereumTx.forEach(f => {
            it(f.description, () => {
                // verify hash using 2 different tools
                if (f.tx.chainId !== 61) {
                    // ETC is not supported
                    const tx = Transaction.fromTxData(f.tx);
                    const hash1 = tx.hash().toString('hex');
                    expect(`0x${hash1}`).toEqual(f.result);
                }
                const serialized = serializeEthereumTx({ ...f.tx, type: 0 }, f.tx.chainId);
                const hash2 = sha3(serialized);
                expect(hash2).toEqual(f.result);
            });
        });
    });
});
