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

    it('format network amount', () => {
        expect(accountUtils.formatNetworkAmount('1', 'btc')).toEqual('0.00000001');
        expect(accountUtils.formatNetworkAmount('1', 'xrp')).toEqual('0.000001');
        expect(accountUtils.formatNetworkAmount('1', 'eth')).toEqual('0.000000000000000001');
        expect(accountUtils.formatNetworkAmount('aaa', 'eth')).toEqual('-1');
    });

    it('format amount to satoshi', () => {
        expect(accountUtils.networkAmountToSatoshi('0.00000001', 'btc')).toEqual('1');
        expect(accountUtils.networkAmountToSatoshi('0.000001', 'xrp')).toEqual('1');
        expect(accountUtils.networkAmountToSatoshi('0.000000000000000001', 'eth')).toEqual('1');
        expect(accountUtils.networkAmountToSatoshi('aaa', 'eth')).toEqual('-1');
    });

    it('get amount for network', () => {
        expect(accountUtils.getNetworkAmount('0.000001', 'btc')).toEqual('0.000001');
        expect(accountUtils.getNetworkAmount('0.111111111111111111111111111111', 'btc')).toEqual(
            '0.11111111',
        );
        expect(accountUtils.getNetworkAmount('0.1', 'btc')).toEqual('0.1');
        expect(accountUtils.getNetworkAmount('0.111111111111111111111111111111', 'eth')).toEqual(
            '0.111111111111111111',
        );
        expect(accountUtils.getNetworkAmount('0.0000000000001', 'eth')).toEqual('0.0000000000001');
    });
});
