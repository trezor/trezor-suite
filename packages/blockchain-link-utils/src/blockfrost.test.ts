import fixtures from './__fixtures__/blockfrost';
import {
    parseAsset,
    transformAccountInfo,
    transformInputOutput,
    transformProtocolParameters,
    transformTokenInfo,
    transformTransaction,
    transformUtxos,
} from './blockfrost';

describe('blockfrost/utils', () => {
    describe('transformUtxos', () => {
        fixtures.transformUtxos.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                expect(transformUtxos(f.utxos)).toEqual(f.result);
            });
        });
    });

    describe('parseAsset', () => {
        fixtures.parseAsset.forEach(f => {
            it(f.description, () => {
                expect(parseAsset(f.hex)).toEqual(f.result);
            });
        });
    });

    describe('transformTokenInfo', () => {
        fixtures.transformTokenInfo.forEach(f => {
            it(f.description, () => {
                expect(transformTokenInfo(f.tokens)).toEqual(f.result);
            });
        });
    });

    describe('transformInputOutput', () => {
        fixtures.transformInputOutput.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                expect(transformInputOutput(f.data, f.asset)).toEqual(f.result);
            });
        });
    });

    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(f => {
            it(f.description, () => {
                expect(
                    // @ts-expect-error incorrect params
                    transformTransaction(f.data, f.accountAddress ?? f.descriptor),
                ).toMatchObject(f.result);
            });
        });
    });

    describe('transformAccountInfo', () => {
        fixtures.transformAccountInfo.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error incorrect params
                expect(transformAccountInfo(f.data)).toEqual(f.result);
            });
        });
    });

    describe('transformProtocolParameters', () => {
        const epochParameters = {
            epoch: 656,
            min_fee_a: 44,
            min_fee_b: 155381,
            max_tx_size: 16384,
            max_val_size: '5000',
            key_deposit: '2000000',
            pool_deposit: '500000000',
            coins_per_utxo_size: '4310',
        };

        it('maps Blockfrost epoch parameters', () => {
            expect(transformProtocolParameters(epochParameters)).toEqual({
                epoch: 656,
                minFeeA: '44',
                minFeeB: '155381',
                maxTxSize: 16384,
                maxValueSize: 5000,
                keyDeposit: '2000000',
                poolDeposit: '500000000',
                coinsPerUtxoByte: '4310',
            });
        });

        it('keeps nullable fields as null', () => {
            expect(
                transformProtocolParameters({
                    ...epochParameters,
                    max_val_size: null,
                    coins_per_utxo_size: null,
                }),
            ).toMatchObject({ maxValueSize: null, coinsPerUtxoByte: null });
        });
    });
});
