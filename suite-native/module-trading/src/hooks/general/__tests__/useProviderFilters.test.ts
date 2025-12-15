import type { ExchangeTrade } from 'invity-api';

import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { type QuotesByCategories } from '@suite-native/trading-types';

import { useProviderFilters } from '../useProviderFilters';

type UseProviderFilterProps = {
    quotes?: QuotesByCategories<ExchangeTrade>;
    shouldShowFilters?: boolean;
    areTradingExchangeDexesEnabled?: boolean;
};
describe('useProviderFilters', () => {
    const renderUseProviderFilters = (initialProps: UseProviderFilterProps) =>
        renderHookWithBasicProvider(
            ({
                quotes = { fixed: [], float: [], dex: [] },
                shouldShowFilters = true,
                areTradingExchangeDexesEnabled = true,
            }) => useProviderFilters(quotes, shouldShowFilters, areTradingExchangeDexesEnabled),
            {
                initialProps,
            },
        );

    it('filterItems should be stable', () => {
        const { result, rerender } = renderUseProviderFilters({});

        const initialFilterItems = result.current.filterItems;

        expect(initialFilterItems).toEqual([
            { label: 'All', value: 'all' },
            { label: 'CEX', value: 'cex' },
            { label: 'DEX', value: 'dex' },
        ]);

        rerender({});

        expect(result.current.filterItems).toEqual(initialFilterItems);
    });

    it('should return all given sections even when empty when no filter is selected ', () => {
        const { result } = renderUseProviderFilters({
            quotes: {
                fixed: [],
                float: [],
            },
        });

        expect(result.current.filteredSections).toEqual([
            { key: 'fixed', data: [], label: '', sectionData: 'fixed' },
            { key: 'float', data: [], label: '', sectionData: 'float' },
        ]);
    });

    it('should return all sections when "all" filter is selected', () => {
        const { result } = renderUseProviderFilters({});

        act(() => {
            result.current.setSelectedFilter('all');
        });

        expect(result.current.selectedFilter).toBe('all');
        expect(result.current.filteredSections).toEqual([
            { key: 'fixed', data: [], label: '', sectionData: 'fixed' },
            { key: 'float', data: [], label: '', sectionData: 'float' },
            { key: 'dex', data: [], label: '', sectionData: 'dex' },
        ]);
    });

    it('should return fixed and float when CEX is selected', () => {
        const { result } = renderUseProviderFilters({});

        act(() => {
            result.current.setSelectedFilter('cex');
        });

        expect(result.current.selectedFilter).toBe('cex');
        expect(result.current.filteredSections).toEqual([
            { key: 'fixed', data: [], label: '', sectionData: 'fixed' },
            { key: 'float', data: [], label: '', sectionData: 'float' },
        ]);
    });

    it('should return dex when DEX is selected', () => {
        const { result } = renderUseProviderFilters({});

        act(() => {
            result.current.setSelectedFilter('dex');
        });

        expect(result.current.selectedFilter).toBe('dex');
        expect(result.current.filteredSections).toEqual([
            { key: 'dex', data: [], label: '', sectionData: 'dex' },
        ]);
    });

    it('should return all section when cex is selected but shouldShowFilters is false', () => {
        const { result } = renderUseProviderFilters({ shouldShowFilters: false });

        act(() => {
            result.current.setSelectedFilter('cex');
        });

        expect(result.current.selectedFilter).toBe('cex');
        expect(result.current.filteredSections).toEqual([
            { key: 'fixed', data: [], label: '', sectionData: 'fixed' },
            { key: 'float', data: [], label: '', sectionData: 'float' },
            { key: 'dex', data: [], label: '', sectionData: 'dex' },
        ]);
    });

    it('should return only CEX sections when DEX is disabled', () => {
        const { result } = renderUseProviderFilters({
            shouldShowFilters: false,
            areTradingExchangeDexesEnabled: false,
        });

        expect(result.current.filteredSections).toEqual([
            { key: 'fixed', data: [], label: '', sectionData: 'fixed' },
            { key: 'float', data: [], label: '', sectionData: 'float' },
        ]);
    });
});
