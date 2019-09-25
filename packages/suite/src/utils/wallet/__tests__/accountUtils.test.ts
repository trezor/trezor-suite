import * as accountUtils from '../accountUtils';
import * as fixtures from './fixtures/accountUtils';
import { Account } from '@wallet-types';

const { intlMock } = global.JestMocks;

describe('accountUtils', () => {
    fixtures.parseBIP44Path.forEach(f => {
        it('accountUtils.parseBIP44Path', () => {
            expect(accountUtils.parseBIP44Path(f.path)).toEqual(f.result);
        });
    });

    fixtures.formatNetworkAmount.forEach(f => {
        it('accountUtils.formatNetworkAmount', () => {
            expect(accountUtils.formatNetworkAmount(f.amount, f.symbol)).toEqual(f.result);
        });
    });

    fixtures.sortByCoin.forEach(f => {
        it('accountUtils.sortByCoin', () => {
            expect(accountUtils.sortByCoin(f.accounts as Account[])).toEqual(f.result);
        });
    });

    describe('get title for network', () => {
        fixtures.accountTitleFixture.forEach((fixture: any) => {
            it(fixture.symbol, () => {
                // @ts-ignore: InjectedIntl mock
                const title = accountUtils.getTitleForNetwork(fixture.symbol, intlMock);
                expect(title).toBe(fixture.title);
            });
        });
    });

    describe('get type for network', () => {
        fixtures.accountTypeFixture.forEach((fixture: any) => {
            it(fixture.networkType, () => {
                // @ts-ignore: InjectedIntl mock
                const title = accountUtils.getTypeForNetwork(fixture.networkType, intlMock);
                expect(title).toBe(fixture.title);
            });
        });
    });

    it('get fiat value', () => {
        expect(accountUtils.getFiatValue('1', '10')).toEqual('10.00');
        expect(accountUtils.getFiatValue('1', '10', 5)).toEqual('10.00000');
        expect(accountUtils.getFiatValue('s', '10')).toEqual('');
    });
});
