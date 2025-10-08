import { useMemo, useState } from 'react';

import { AssetProps } from '@trezor/product-components';

import { NetworkTab } from './useNetworksTabs';

function createSearchFilter(search: string) {
    return function searchFor(property?: string) {
        return Boolean(property?.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    };
}

export function useOptionsSearch(allOptions: AssetProps[], activeTab: NetworkTab) {
    const [search, setSearch] = useState('');

    const filteredOptions = useMemo(
        () =>
            allOptions.filter(item => {
                if (
                    activeTab &&
                    item.coingeckoId !== activeTab.coingeckoId &&
                    item.symbol !== activeTab.symbol
                ) {
                    return false;
                }

                const contractAddress = item.contractAddress || undefined;
                const searchFor = createSearchFilter(search);

                return (
                    searchFor(item.cryptoName) ||
                    (typeof item.badge === 'string' && searchFor(item.badge)) ||
                    searchFor(item.ticker) ||
                    searchFor(contractAddress) ||
                    searchFor(item.symbol)
                );
            }),
        [activeTab, allOptions, search],
    );

    return {
        filteredOptions,
        setSearch,
        search,
    } as const;
}
