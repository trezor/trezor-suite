import { useMemo, useState } from 'react';

import { TradingTradeType } from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';

import { SectionListData, SectionListDataArray } from './useSectionList';
import { FilterItem } from '../../components/general/FilterTabs';
import { QuotesByCategories, QuotesCategory } from '../../types/general';

export type FilterValue = 'all' | 'cex' | 'dex';

export const useProviderFilters = <T extends TradingTradeType>(
    quotes: QuotesByCategories<T>,
    shouldShowFilters: boolean,
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
        const allSections = Object.entries(quotes).map(([category, items]) => {
            const typedCategory = category as QuotesCategory;

            return {
                key: category,
                data: items as SectionListDataArray<T>,
                label: '',
                sectionData: typedCategory,
            };
        });

        if (!shouldShowFilters || selectedFilter === 'all') {
            return allSections;
        }

        if (selectedFilter === 'cex') {
            return allSections.filter(
                section => section.key === 'fixed' || section.key === 'float',
            );
        }

        if (selectedFilter === 'dex') {
            return allSections.filter(section => section.key === 'dex');
        }

        return allSections;
    }, [quotes, selectedFilter, shouldShowFilters]);

    return {
        selectedFilter,
        setSelectedFilter,
        filterItems,
        filteredSections,
    };
};
