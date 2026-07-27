import { useMemo, useState } from 'react';

import { normalizeForSearch } from '@suite-common/suite-utils';
import { useSectionDataFilter } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { type SectionListData } from '@suite-native/trading-atoms';
import { type MyAssetRow, type MyAssetTradeable } from '@suite-native/trading-types';

const filterCallback = (item: MyAssetRow, filterValue: string): boolean => {
    if (!item.isEnabled) {
        return false;
    }

    const normalized = normalizeForSearch(filterValue);
    const asset = item;

    return (
        normalizeForSearch(asset.name).includes(normalized) ||
        normalizeForSearch(asset.symbol).includes(normalized) ||
        (asset.tokenSymbol != null && normalizeForSearch(asset.tokenSymbol).includes(normalized)) ||
        (asset.cryptoId != null && normalizeForSearch(asset.cryptoId).includes(normalized))
    );
};

const getSortWeight = (asset: MyAssetTradeable, query: string): number => {
    const name = normalizeForSearch(asset.name);
    const symbol = normalizeForSearch(asset.tokenSymbol ?? asset.symbol);

    if (name === query) return 0;
    if (symbol === query) return 1;
    if (name.startsWith(query)) return 2;
    if (symbol.startsWith(query)) return 3;
    if (name.includes(query)) return 4;
    if (symbol.includes(query)) return 5;

    return 6;
};

const sortSectionItemsCallback = (a: MyAssetRow, b: MyAssetRow, filterValue: string): number => {
    const query = normalizeForSearch(filterValue);

    return (
        getSortWeight(a as MyAssetTradeable, query) - getSortWeight(b as MyAssetTradeable, query)
    );
};

export const useMyAssetsFilteredData = (sections: SectionListData<MyAssetRow, Account>) => {
    const [filterSymbol, setFilterSymbol] = useState<NetworkSymbol | undefined>(undefined);

    const sectionsForTextFilter = useMemo(() => {
        if (!filterSymbol) {
            return sections;
        }

        return sections
            .map(section => ({
                ...section,
                data: section.data.filter(item => item.isEnabled && item.symbol === filterSymbol),
            }))
            .filter(section => section.data.length > 0);
    }, [sections, filterSymbol]);

    const {
        filteredSections,
        filterValue: searchText,
        setFilterValue,
    } = useSectionDataFilter(sectionsForTextFilter, filterCallback, sortSectionItemsCallback);

    const availableNetworks = useMemo(
        () =>
            Array.from(
                new Set(
                    sections.flatMap(section =>
                        section.data.filter(item => item.isEnabled).map(item => item.symbol),
                    ),
                ),
            ),
        [sections],
    );

    const filterValue = `Network:${filterSymbol ?? 'all'};Search:${searchText}`;

    return { filteredSections, setFilterValue, setFilterSymbol, availableNetworks, filterValue };
};
