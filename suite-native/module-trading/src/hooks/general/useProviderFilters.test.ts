import type { ExchangeTrade } from 'invity-api';

import { EMPTY_GROUPED_TRADING_EXCHANGE_QUOTES } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { type QuotesByCategories } from '@suite-native/trading-types';

import { useProviderFilters } from './useProviderFilters';

type UseProviderFilterProps = {
    quotes?: QuotesByCategories<ExchangeTrade>;
    shouldShowFilters?: boolean;
};
describe('useProviderFilters', () => {
    const renderUseProviderFilters = async (initialProps: UseProviderFilterProps) =>
        await renderHookWithBasicProvider(
            ({ quotes = EMPTY_GROUPED_TRADING_EXCHANGE_QUOTES, shouldShowFilters = true }) =>
                useProviderFilters(quotes, shouldShowFilters),
            {
                initialProps,
            },
        );

    it('filterItems should be stable', async () => {
        const { result, rerender } = await renderUseProviderFilters({});

        const initialFilterItems = result.current.filterItems;

        expect(initialFilterItems).toEqual([
            {
                label: getTranslation('moduleTrading.providerSheet.filters.allProviders'),
                value: 'all',
            },
            {
                label: getTranslation('moduleTrading.providerSheet.filters.centralized'),
                value: 'cex',
            },
        ]);

        await rerender({});

        expect(result.current.filterItems).toEqual(initialFilterItems);
    });

    it('should return fixed and float sections even when empty and merge DEX into float', async () => {
        const { result } = await renderUseProviderFilters({
            quotes: {
                fixed: [],
                float: [],
            },
        });

        expect(result.current.filteredSections).toEqual([
            { key: 'float', data: [], label: '', sectionData: 'float' },
            { key: 'fixed', data: [], label: '', sectionData: 'fixed' },
        ]);
    });

    it('should return fixed and float sections when "all" filter is selected', async () => {
        const { result } = await renderUseProviderFilters({});

        await act(() => {
            result.current.setSelectedFilter('all');
        });

        expect(result.current.selectedFilter).toBe('all');
        expect(result.current.filteredSections).toEqual([
            { key: 'float', data: [], label: '', sectionData: 'float' },
            { key: 'fixed', data: [], label: '', sectionData: 'fixed' },
        ]);
    });

    it('should merge DEX quotes into float and sort section quotes by best offer', async () => {
        const { result } = await renderUseProviderFilters({
            quotes: {
                fixed: [
                    { orderId: 'fixed-worse', rate: 1 } as ExchangeTrade,
                    { orderId: 'fixed-best', rate: 3 } as ExchangeTrade,
                ],
                float: [
                    { orderId: 'float-1', rate: 2 } as ExchangeTrade,
                    { orderId: 'dex-1', isDex: true, rate: 4 } as ExchangeTrade,
                ],
            },
        });

        expect(result.current.filteredSections).toEqual([
            {
                key: 'float',
                data: [
                    { orderId: 'dex-1', isDex: true, rate: 4 },
                    { orderId: 'float-1', rate: 2 },
                ],
                label: '',
                sectionData: 'float',
            },
            {
                key: 'fixed',
                data: [
                    { orderId: 'fixed-best', rate: 3 },
                    { orderId: 'fixed-worse', rate: 1 },
                ],
                label: '',
                sectionData: 'fixed',
            },
        ]);
    });

    it('should keep both rate sections and show only CEX quotes when CEX is selected', async () => {
        const { result } = await renderUseProviderFilters({
            quotes: {
                fixed: [
                    { orderId: 'fixed-1' } as ExchangeTrade,
                    { orderId: 'fixed-dex', isDex: true } as ExchangeTrade,
                ],
                float: [
                    { orderId: 'float-1' } as ExchangeTrade,
                    { orderId: 'dex-1', isDex: true } as ExchangeTrade,
                ],
            },
        });

        await act(() => {
            result.current.setSelectedFilter('cex');
        });

        expect(result.current.selectedFilter).toBe('cex');
        expect(result.current.filteredSections).toEqual([
            {
                key: 'float',
                data: [{ orderId: 'float-1' }],
                label: '',
                sectionData: 'float',
            },
            {
                key: 'fixed',
                data: [{ orderId: 'fixed-1' }],
                label: '',
                sectionData: 'fixed',
            },
        ]);
    });

    it('should keep both rate sections and show only DEX quotes when DEX is selected', async () => {
        const { result } = await renderUseProviderFilters({
            quotes: {
                fixed: [{ orderId: 'fixed-1' } as ExchangeTrade],
                float: [
                    { orderId: 'float-1' } as ExchangeTrade,
                    { orderId: 'dex-1', isDex: true } as ExchangeTrade,
                ],
            },
        });

        await act(() => {
            result.current.setSelectedFilter('dex');
        });

        expect(result.current.selectedFilter).toBe('dex');
        expect(result.current.filteredSections).toEqual([
            {
                key: 'float',
                data: [{ orderId: 'dex-1', isDex: true }],
                label: '',
                sectionData: 'float',
            },
            { key: 'fixed', data: [], label: '', sectionData: 'fixed' },
        ]);
    });

    it('should return all given sections when shouldShowFilters is false', async () => {
        const { result } = await renderUseProviderFilters({
            shouldShowFilters: false,
            quotes: {
                fixed: [{ orderId: 'fixed-1' } as ExchangeTrade],
            },
        });

        await act(() => {
            result.current.setSelectedFilter('cex');
        });

        expect(result.current.selectedFilter).toBe('cex');
        expect(result.current.filteredSections).toEqual([
            {
                key: 'fixed',
                data: [{ orderId: 'fixed-1' }],
                label: '',
                sectionData: 'fixed',
            },
        ]);
    });
});
