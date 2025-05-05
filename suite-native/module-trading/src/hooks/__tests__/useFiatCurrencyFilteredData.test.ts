import { act, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { useFiatCurrencyFilteredData } from '../useFiatCurrencyFilteredData';

describe('useFiatCurrencyFilteredData', () => {
    const renderUseFiatCurrencyFilteredData = () =>
        renderHookWithStoreProviderAsync(() => useFiatCurrencyFilteredData(), {
            preloadedState: { wallet: { tradingNew: getInitializedTradingState() } },
        });

    it('should return section list data structure', async () => {
        const { result } = await renderUseFiatCurrencyFilteredData();

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

    it('should filter by label case-insensitive', async () => {
        const { result } = await renderUseFiatCurrencyFilteredData();

        act(() => {
            result.current.setFilterValue('unITed');
        });

        expect(result.current.filteredData[0].data).toEqual([
            expect.objectContaining({ value: 'usd' }),
        ]);
    });

    it('should filter by value case-insensitive', async () => {
        const { result } = await renderUseFiatCurrencyFilteredData();

        act(() => {
            result.current.setFilterValue('uSd');
        });

        expect(result.current.filteredData[0].data).toEqual([
            expect.objectContaining({ value: 'usd' }),
        ]);
    });

    it('should return current filter value', async () => {
        const { result } = await renderUseFiatCurrencyFilteredData();

        act(() => {
            result.current.setFilterValue('usd');
        });

        expect(result.current.filterValue).toEqual('usd');
    });
});
