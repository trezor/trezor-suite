import { useMemo, useState } from 'react';

import { SelectAssetOptionCurrencyProps } from 'src/types/trading/trading';

function createSearchFilter(search: string) {
    return function searchFor(property?: string) {
        return Boolean(property?.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    };
}

export function useOptionsSearch(activeTabOptions: SelectAssetOptionCurrencyProps[]) {
    const [search, setSearch] = useState('');

    const filteredOptions = useMemo<SelectAssetOptionCurrencyProps[]>(
        () =>
            activeTabOptions.filter(item => {
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
        [activeTabOptions, search],
    );

    return {
        filteredOptions,
        setSearch,
        search,
    } as const;
}
