import { Transaction, networks } from '@trezor/utxo-lib';

import { createPendingTransaction } from './createPendingTx';

describe('helpers/createPendingTransaction', () => {
    // A minimal legacy (non-segwit) transaction. For legacy txs weight() === 4 * byteLength(),
    // so it cleanly distinguishes the byte size from the weight units.
    const hex =
        '01000000016d20f69067ad1ffd50ee7c0f377dde2c932ccb03e84b5659732da99c20f1f650010000006b483045022100a200ea1278c3d32251a63c56f5f0861f48167c61d84de8d951eac1204856ccd402201fc03f446557bcbcef1e473616bb7bddc96561b656b7ddd6b419501543ed5044012102a7a079c1ef9916b289c2ff21a992c808d0de3dfcf8a9f163205c5c9e21f55d5cffffffff0110270000000000001976a914de9b2a8da088824e8fe51debea566617d851537888ac00000000';

    it('reports size in bytes (byteLength), not weight units', () => {
        const tx = Transaction.fromHex(hex, { network: networks.bitcoin });
        const pending = createPendingTransaction(tx, {
            addresses: { used: [], unused: [], change: [] },
            inputs: [],
            outputs: [],
        });

        expect(pending.size).toBe(tx.byteLength());
        expect(pending.vsize).toBe(tx.virtualSize());
        // Guards the regression: weight() is 4x the byte size for a legacy tx.
        expect(pending.size).not.toBe(tx.weight());
    });
});
