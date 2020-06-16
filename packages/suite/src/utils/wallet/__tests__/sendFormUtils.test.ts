import { FakeTransaction } from 'ethereumjs-tx';
import { sha3 } from 'web3-utils';
import * as fixtures from '../__fixtures__/sendFormFixtures';
import { prepareEthereumTransaction, serializeEthereumTx } from '../sendFormUtils';

describe('sendForm utils', () => {
    fixtures.prepareEthereumTransaction.forEach(f => {
        it(`prepareEthereumTransaction: ${f.description}`, () => {
            expect(prepareEthereumTransaction(f.txInfo)).toEqual(f.result);
        });
    });

    fixtures.serializeEthereumTx.forEach(f => {
        it(`serializeEthereumTx: ${f.description}`, () => {
            const serialized = serializeEthereumTx(f.tx);
            // verify hash using 2 different tools
            if (f.tx.chainId !== 61) {
                // ETC is not supported
                const tx = new FakeTransaction(serialized);
                const hash1 = tx.hash().toString('hex');
                expect(`0x${hash1}`).toEqual(f.result);
            }
            const hash2 = sha3(serialized);
            expect(hash2).toEqual(f.result);
        });
    });
});
