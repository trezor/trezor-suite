import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

import * as fixtures from './__fixtures__/common';
import * as utils from './common';

describe('common utils', () => {
    test('multiAssetToArray', () => {
        const multiAsset = utils.buildMultiAsset([
            {
                quantity: '1000',
                unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
            },
        ]);
        const res = utils.multiAssetToArray(multiAsset);
        expect(res).toMatchObject([
            {
                quantity: '1000',
                unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
            },
        ]);
    });

    fixtures.filterUtxos.forEach(f => {
        test(f.description, () => {
            expect(utils.filterUtxos(f.utxos, f.asset)).toMatchObject(f.result);
        });
    });

    fixtures.buildTxOutput.forEach(f => {
        test(f.description, () => {
            const output = utils.buildTxOutput(f.output, f.dummyAddress);
            const assets = utils.multiAssetToArray(output.amount().multiasset());

            let address;
            if (CardanoWasm.ByronAddress.is_valid(f.result.address)) {
                // expecting byron address
                address = CardanoWasm.ByronAddress.from_bytes(
                    output.address().to_bytes(),
                ).to_base58();
            } else {
                address = output.address().to_bech32(); // by default expect shelley
            }
            expect(output.amount().coin().to_str()).toBe(f.result.amount);
            expect(address).toBe(f.result.address);
            expect(assets).toStrictEqual(f.result.assets);
        });
    });

    fixtures.orderInputs.forEach(f => {
        test(f.description, () => {
            const inputs = utils.orderInputs(
                f.inputsToOrder,
                CardanoWasm.TransactionBody.from_bytes(Buffer.from(f.txBodyHex, 'hex')),
            );
            expect(inputs).toStrictEqual(f.result);
        });
    });
});
