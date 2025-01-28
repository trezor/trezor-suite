import * as fixtures from '../__fixtures__/filterAndCategorizeUtxosFixture';
import * as filterAndCategorizeUtxos from '../filterAndCategorizeUtxosUtils';

describe('filterAndCategorizeUtxos', () => {
    it('filter and categorizes correctly while searching by address', () => {
        fixtures.filterByAddress.forEach(({ params, checkResult }) => {
            const categorized = filterAndCategorizeUtxos.filterAndCategorizeUtxos(params);

            expect(checkResult(categorized)).toBe(true);
        });
    });

    it('filter and categorizes correctly while searching by txid', () => {
        fixtures.filterByTxid.forEach(({ params, checkResult }) => {
            const categorized = filterAndCategorizeUtxos.filterAndCategorizeUtxos(params);

            expect(checkResult(categorized)).toBe(true);
        });
    });

    it('filter and categorizes correctly while searching by label', () => {
        fixtures.filterByLabel.forEach(({ params, checkResult }) => {
            const categorized = filterAndCategorizeUtxos.filterAndCategorizeUtxos(params);

            expect(checkResult(categorized)).toBe(true);
        });
    });
});
