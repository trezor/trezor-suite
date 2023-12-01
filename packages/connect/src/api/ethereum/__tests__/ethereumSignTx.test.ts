import { TransactionFactory } from '@ethereumjs/tx';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { bytesToHex } from 'ethereum-cryptography/utils';

import { serializeEthereumTx } from '../ethereumSignTx';

import * as fixtures from '../__fixtures__/ethereumSignTx';

describe('helpers/ethereumSignTx', () => {
    describe('serializeEthereumTx', () => {
        fixtures.serializeEthereumTx.forEach(f => {
            it(f.description, () => {
                // verify hash using 2 different tools
                if (f.tx.chainId !== 61) {
                    // ETC is not supported
                    const tx = TransactionFactory.fromTxData(f.tx);
                    const hash1 = Buffer.from(tx.hash()).toString('hex');
                    expect(`0x${hash1}`).toEqual(f.result);
                }
                const serialized = serializeEthereumTx({ ...f.tx, type: 0 }, f.tx.chainId);
                const hash2 = bytesToHex(keccak256(Buffer.from(serialized.slice(2), 'hex')));
                expect(`0x${hash2}`).toEqual(f.result);
            });
        });
    });
});
