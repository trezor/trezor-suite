import { transformFiatCurrencyToSelectItem } from '../components/CurrencySelector';

test('transformFiatCurrencyToSelectItem returns correct value', () => {
    expect(
        transformFiatCurrencyToSelectItem({ label: 'usd', value: 'United States Dollar' }),
    ).toEqual({ value: 'usd', label: 'United States Dollar' });
});
