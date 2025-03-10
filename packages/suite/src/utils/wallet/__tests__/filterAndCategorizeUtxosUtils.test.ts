import {
    baseUtxo,
    filterAndCategorizeUtxosFixtures,
} from '../__fixtures__/filterAndCategorizeUtxosFixtures';
import { filterAndCategorizeUtxos } from '../filterAndCategorizeUtxosUtils';

describe(filterAndCategorizeUtxos.name, () => {
    it('filters and categorizes correctly while searching by address', () => {
        filterAndCategorizeUtxosFixtures.filterByAddress.forEach(({ params, checkResult }) => {
            const categorized = filterAndCategorizeUtxos(params);

            expect(checkResult(categorized)).toBe(true);
        });
    });

    it('filters and categorizes correctly while searching by txid', () => {
        filterAndCategorizeUtxosFixtures.filterByTxid.forEach(({ params, checkResult }) => {
            const categorized = filterAndCategorizeUtxos(params);

            expect(checkResult(categorized)).toBe(true);
        });
    });

    it('filters and categorizes correctly while searching by label', () => {
        filterAndCategorizeUtxosFixtures.filterByLabel.forEach(({ params, checkResult }) => {
            const categorized = filterAndCategorizeUtxos(params);

            expect(checkResult(categorized)).toBe(true);
        });
    });

    it('filters the legacy addresses with uppercase letters with lowercase query', () => {
        const categorized = filterAndCategorizeUtxos({
            searchQuery: '1GD',
            dustUtxos: [],
            spendableUtxos: [],
            lowAnonymityUtxos: [],
            utxos: [{ ...baseUtxo, address: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q' }],
            outputLabels: {},
        });

        expect(categorized.filteredUtxos.map(utxo => utxo.address)).toStrictEqual([
            'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q',
        ]);
    });
});
