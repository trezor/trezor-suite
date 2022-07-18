import { getLocalCurrency } from '@suite-common/wallet-utils';

describe('settings utils', () => {
    it('get local currency value', () => {
        expect(getLocalCurrency('usd')).toMatchObject({ value: 'usd', label: 'USD' });
        expect(getLocalCurrency('czk')).toMatchObject({ value: 'czk', label: 'CZK' });
    });
});
