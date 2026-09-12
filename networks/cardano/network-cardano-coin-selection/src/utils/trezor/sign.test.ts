import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

import * as fixtures from './__fixtures__/sign';
import * as utils from './sign';

describe('trezor sign utils', () => {
    fixtures.sign.forEach(f => {
        test(f.description, () => {
            const signedTx = utils.signTransaction(f.hex, f.witnesses, {
                testnet: f.testnet,
            });
            expect(utils.signTransaction(f.hex, f.witnesses, { testnet: f.testnet })).toBe(
                f.signedTx,
            );

            const tx = CardanoWasm.Transaction.from_bytes(Buffer.from(signedTx, 'hex'));
            const txhash = CardanoWasm.FixedTransaction.new_from_body_bytes(tx.body().to_bytes())
                .transaction_hash()
                .to_hex();

            // just sanity check, signing shouldn't change the hash
            expect(txhash).toBe(f.txHash);
        });
    });
});
