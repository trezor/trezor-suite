import {
    parseAsset,
    transformUtxos,
    transformTokenInfo,
    transformInputOutput,
    transformTransaction,
    transformAccountInfo,
} from '../blockfrost';
import fixtures from './fixtures/blockfrost';

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
});
