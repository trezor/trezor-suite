import { TransactionFactory } from '@ethereumjs/tx';
import { keccak256, toHex } from 'web3-utils';

import { serializeEthereumTx } from '../ethereumSignTx';

import * as fixtures from '../__fixtures__/ethereumSignTx';

describe('helpers/ethereumSignTx', () => {
    describe('serializeEthereumTx', () => {
        fixtures.serializeEthereumTx.forEach(f => {
            it(f.description, () => {
                // ETC is not supported
                if (f.chainId !== 61) {
                    const tx = TransactionFactory.fromTxData(f.tx);
                    const hash1 = Buffer.from(tx.hash()).toString('hex');
                    expect(`0x${hash1}`).toEqual(f.result);
                }
                const serialized = serializeEthereumTx({ ...f.tx, type: 0 }, f.chainId);
                const hash2 = toHex(
                    keccak256(Uint8Array.from(Buffer.from(serialized.slice(2), 'hex'))),
                );
                expect(hash2).toEqual(f.result);
            });
        });
    });
});
