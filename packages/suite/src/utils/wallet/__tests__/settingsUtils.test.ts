import { getLocalCurrency } from '../settingsUtils';

describe('settings utils', () => {
    it('get local currency value', () => {
        expect(getLocalCurrency('usd')).toMatchObject({ value: 'usd', label: 'USD' });
        expect(getLocalCurrency('czk')).toMatchObject({ value: 'czk', label: 'CZK' });
    });
});
