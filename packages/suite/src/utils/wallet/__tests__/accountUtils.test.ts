import * as accountUtils from '../accountUtils';
import * as fixtures from './fixtures/accountUtils';
import { Account } from '@wallet-types';

describe('accountUtils', () => {
    fixtures.parseBIP44Path.forEach(f => {
        it('accountUtils.parseBIP44Path', () => {
            expect(accountUtils.parseBIP44Path(f.path)).toEqual(f.result);
        });
    });

    fixtures.formatAmount.forEach(f => {
        it('accountUtils.formatAmount', () => {
            expect(accountUtils.formatAmount(f.amount, f.symbol)).toEqual(f.result);
        });
    });

    fixtures.sortByCoin.forEach(f => {
        it('accountUtils.sortByCoin', () => {
            expect(accountUtils.sortByCoin(f.accounts as Account[])).toEqual(f.result);
        });
    });
});
