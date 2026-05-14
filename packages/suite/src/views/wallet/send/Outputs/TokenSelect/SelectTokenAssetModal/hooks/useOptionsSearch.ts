import { useMemo, useState } from 'react';

import { type AssetProps } from '@trezor/product-components';

function createSearchFilter(search: string) {
    return function searchFor(property?: string) {
        return Boolean(property?.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    };
}

export function useOptionsSearch(options: AssetProps[]) {
    const [search, setSearch] = useState('');

    const filteredOptions = useMemo(
        () =>
            options.filter(item => {
                if (!search) {
                    return true;
                }

                const contractAddress = item.contractAddress || undefined;
                const searchFor = createSearchFilter(search);

                return (
                    searchFor(item.cryptoName) ||
                    searchFor(item.ticker) ||
                    searchFor(contractAddress)
                );
            }),
        [options, search],
    );

    return {
        filteredOptions,
        setSearch,
        search,
    } as const;
}
