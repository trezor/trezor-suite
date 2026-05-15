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
    const asset = item as MyAssetTradeable;

    return (
        normalizeForSearch(asset.name).includes(normalized) ||
        normalizeForSearch(asset.symbol).includes(normalized) ||
        (asset.tokenSymbol != null && normalizeForSearch(asset.tokenSymbol).includes(normalized)) ||
        (asset.cryptoId != null && normalizeForSearch(asset.cryptoId).includes(normalized))
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
    } = useSectionDataFilter(sectionsForTextFilter, filterCallback);

    const availableNetworks = useMemo(
        () =>
            Array.from(
                new Set(
                    sections.flatMap(section =>
                        section.data
                            .filter(item => item.isEnabled)
                            .map(item => (item as MyAssetTradeable).symbol),
                    ),
                ),
            ),
        [sections],
    );

    const filterValue = `Network:${filterSymbol ?? 'all'};Search:${searchText}`;

    return { filteredSections, setFilterValue, setFilterSymbol, availableNetworks, filterValue };
};
