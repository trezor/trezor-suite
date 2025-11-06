import { memo, useEffect, useState } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { SearchAsset } from '@trezor/product-components';

import { useTranslation } from 'src/hooks/suite';

export interface AssetSearchWithNetworkFilterProps {
    placeholder: TranslationKey;
    onSearch: (search: string) => void;
    onNetworkFilter: (networkFilter: NetworkSymbol | undefined) => void;
}

/**
 * TODO: Once this PR is merged: https://github.com/trezor/trezor-suite/pull/22926, use the updated `SearchAsset` component.
 */
export const AssetSearchWithNetworkFilter = memo(function AssetSearchWithNetworkFilterInner({
    placeholder,
    onSearch,
    onNetworkFilter,
}: AssetSearchWithNetworkFilterProps) {
    const [search, setSearch] = useState('');
    const [networkFilter] = useState<NetworkSymbol | undefined>(undefined);
    const { translationString } = useTranslation();

    useEffect(() => {
        onSearch(search);
    }, [search, onSearch]);

    useEffect(() => {
        onNetworkFilter(networkFilter);
    }, [networkFilter, onNetworkFilter]);

    return (
        <SearchAsset
            searchPlaceholder={translationString(placeholder)}
            search={search}
            setSearch={setSearch}
        />
    );
});
