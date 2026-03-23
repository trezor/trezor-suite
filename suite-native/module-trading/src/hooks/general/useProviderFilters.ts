import { useMemo, useState } from 'react';

import { type TradingTradeType } from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import type {
    FilterItem,
    SectionListData,
    SectionListDataArray,
} from '@suite-native/trading-atoms';
import { type QuotesByCategories, type QuotesCategory } from '@suite-native/trading-types';
import { exhaustive } from '@trezor/type-utils';

export type FilterValue = 'all' | 'cex' | 'dex';

export const useProviderFilters = <T extends TradingTradeType>(
    quotes: QuotesByCategories<T>,
    shouldShowFilters: boolean,
    areTradingExchangeDexesEnabled: boolean,
) => {
    const { translate } = useTranslate();
    const [selectedFilter, setSelectedFilter] = useState<FilterValue>('all');

    const filterItems: FilterItem<FilterValue>[] = useMemo(
        () => [
            { label: translate('moduleTrading.providerSheet.filters.all'), value: 'all' },
            { label: translate('moduleTrading.providerSheet.filters.cex'), value: 'cex' },
            { label: translate('moduleTrading.providerSheet.filters.dex'), value: 'dex' },
        ],
        [translate],
    );

    const filteredSections: SectionListData<T, QuotesCategory> = useMemo(() => {
        const allSections = Object.entries(quotes)
            .filter(([category]) => areTradingExchangeDexesEnabled || category !== 'dex')
            .map(([category, items]) => {
                const typedCategory = category as QuotesCategory;

                return {
                    key: category,
                    data: items as SectionListDataArray<T>,
                    label: '',
                    sectionData: typedCategory,
                };
            });

        if (!areTradingExchangeDexesEnabled || !shouldShowFilters || selectedFilter === 'all') {
            return allSections;
        }

        switch (selectedFilter) {
            case 'cex':
                return allSections.filter(
                    section => section.key === 'fixed' || section.key === 'float',
                );

            case 'dex':
                return allSections.filter(section => section.key === 'dex');

            default:
                return exhaustive(selectedFilter, 'Unexpected filter value');
        }
    }, [quotes, selectedFilter, shouldShowFilters, areTradingExchangeDexesEnabled]);

    return {
        selectedFilter,
        setSelectedFilter,
        filterItems,
        filteredSections,
    };
};
