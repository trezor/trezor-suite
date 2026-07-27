import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { type FiatCurrencyItem } from '@suite-native/trading-types';

import { useFiatCurrencyFilteredData } from '../useFiatCurrencyFilteredData';

const supportedFiatCurrencies: FiatCurrencyItem[] = [
    {
        displayValue: 'USD',
        label: 'United States Dollar',
        value: 'usd',
    },
    {
        displayValue: 'EUR',
        label: 'Euro',
        value: 'eur',
    },
    {
        displayValue: 'CZK',
        label: 'Czech Koruna',
        value: 'czk',
    },
];

describe('useFiatCurrencyFilteredData', () => {
    const renderUseFiatCurrencyFilteredData = () =>
        renderHookWithBasicProvider(() => useFiatCurrencyFilteredData(supportedFiatCurrencies));

    it('should return section list data structure', () => {
        const { result } = renderUseFiatCurrencyFilteredData();

        expect(result.current.filteredData).toEqual([
            {
                key: 'fiat_currency',
                label: '',
                data: [
                    {
                        displayValue: 'USD',
                        label: 'United States Dollar',
                        value: 'usd',
                    },
                    {
                        displayValue: 'EUR',
                        label: 'Euro',
                        value: 'eur',
                    },
                    {
                        displayValue: 'CZK',
                        label: 'Czech Koruna',
                        value: 'czk',
                    },
                ],
                sectionData: undefined,
            },
        ]);
    });

    it('should filter by label case-insensitive', () => {
        const { result } = renderUseFiatCurrencyFilteredData();

        act(() => {
            result.current.setFilterValue('unITed');
        });

        expect(result.current.filteredData[0]?.data).toEqual([
            expect.objectContaining({ value: 'usd' }),
        ]);
    });

    it('should filter by value case-insensitive', () => {
        const { result } = renderUseFiatCurrencyFilteredData();

        act(() => {
            result.current.setFilterValue('uSd');
        });

        expect(result.current.filteredData[0]?.data).toEqual([
            expect.objectContaining({ value: 'usd' }),
        ]);
    });

    it('should return current filter value', () => {
        const { result } = renderUseFiatCurrencyFilteredData();

        act(() => {
            result.current.setFilterValue('usd');
        });

        expect(result.current.filterValue).toEqual('usd');
    });
});
