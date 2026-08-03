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
    const renderUseProviderFilters = (initialProps: UseProviderFilterProps) =>
        renderHookWithBasicProvider(
            ({ quotes = EMPTY_GROUPED_TRADING_EXCHANGE_QUOTES, shouldShowFilters = true }) =>
                useProviderFilters(quotes, shouldShowFilters),
            {
                initialProps,
            },
        );

    it('filterItems should be stable', () => {
        const { result, rerender } = renderUseProviderFilters({});

        const initialFilterItems = result.current.filterItems;

        expect(initialFilterItems).toEqual([
            { label: getTranslation('moduleTrading.providerSheet.filters.all'), value: 'all' },
            { label: getTranslation('moduleTrading.providerSheet.filters.cex'), value: 'cex' },
            { label: getTranslation('moduleTrading.providerSheet.filters.dex'), value: 'dex' },
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
});
