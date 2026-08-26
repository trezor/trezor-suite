import { useMemo, useState } from 'react';

import { type TradingTradeType } from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import type { FilterItem, SectionListData } from '@suite-native/trading-atoms';
import { type QuotesByCategories, type QuotesCategory } from '@suite-native/trading-types';
import { exhaustive } from '@trezor/type-utils';
import { typedObjectKeys } from '@trezor/utils';

export type FilterValue = 'all' | 'cex' | 'dex';

const EXCHANGE_RATE_CATEGORIES: Exclude<QuotesCategory, 'dex'>[] = ['float', 'fixed'];

const isDexQuote = <T extends TradingTradeType>(quote: T): boolean =>
    'isDex' in quote && quote.isDex === true;

const getQuoteRate = <T extends TradingTradeType>(quote: T): number =>
    'rate' in quote && typeof quote.rate === 'number' ? quote.rate : 0;

const sortByBestOffer = <T extends TradingTradeType>(items: T[]): T[] =>
    [...items].sort((a, b) => getQuoteRate(b) - getQuoteRate(a));

const filterQuotesByProviderType = <T extends TradingTradeType>(
    items: T[],
    filter: FilterValue,
): T[] => {
    switch (filter) {
        case 'all':
            return items;
        case 'cex':
            return items.filter(item => !isDexQuote(item));
        case 'dex':
            return items.filter(item => isDexQuote(item));
        default:
            return exhaustive(filter);
    }
};

export const useProviderFilters = <T extends TradingTradeType>(
    quotes: QuotesByCategories<T>,
    shouldShowFilters: boolean,
) => {
    const { translate } = useTranslate();
    const [selectedFilter, setSelectedFilter] = useState<FilterValue>('all');

    const filterItems: FilterItem<FilterValue>[] = useMemo(
        () => [
            {
                label: translate('moduleTrading.providerSheet.filters.allProviders'),
                value: 'all',
            },
            {
                label: translate('moduleTrading.providerSheet.filters.centralized'),
                value: 'cex',
            },
            {
                label: translate('moduleTrading.providerSheet.filters.decentralized'),
                value: 'dex',
            },
        ],
        [translate],
    );

    const filteredSections: SectionListData<T, QuotesCategory> = useMemo(() => {
        if (!shouldShowFilters) {
            return typedObjectKeys(quotes).map(category => ({
                key: category,
                data: quotes[category] ?? [],
                label: '',
                sectionData: category,
            }));
        }

        // DEX quotes are shown inside fixed/float rate sections (no dedicated DEX section).
        const quotesByRateCategory: Record<'fixed' | 'float', T[]> = {
            fixed: quotes.fixed ?? [],
            float: [...(quotes.float ?? []), ...(quotes.dex ?? [])],
        };

        return EXCHANGE_RATE_CATEGORIES.map(category => ({
            key: category,
            data: sortByBestOffer(
                filterQuotesByProviderType(quotesByRateCategory[category], selectedFilter),
            ),
            label: '',
            sectionData: category,
        }));
    }, [quotes, selectedFilter, shouldShowFilters]);

    return {
        selectedFilter,
        setSelectedFilter,
        filterItems,
        filteredSections,
    };
};
