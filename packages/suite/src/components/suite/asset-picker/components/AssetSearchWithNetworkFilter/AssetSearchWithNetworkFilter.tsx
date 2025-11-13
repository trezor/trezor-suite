import { memo, useEffect, useState } from 'react';
import { useDebounce } from 'react-use';

import { TranslationKey } from '@suite-common/intl-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { SearchAsset } from '@trezor/product-components';

import { useSelector, useTranslation } from 'src/hooks/suite';

export interface AssetSearchWithNetworkFilterProps {
    placeholder: TranslationKey;
    onSearch: (search: string) => void;
    onNetworkFilter: (networkFilter: NetworkSymbol | undefined) => void;
}

export const AssetSearchWithNetworkFilter = memo(function AssetSearchWithNetworkFilterInner({
    placeholder,
    onSearch,
    onNetworkFilter,
}: AssetSearchWithNetworkFilterProps) {
    const [search, setSearch] = useState('');
    const [networkFilter, setNetworkFilter] = useState<NetworkSymbol | undefined>(undefined);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const { translationString } = useTranslation();

    useDebounce(() => onSearch(search), 200, [search, onSearch]);

    useEffect(() => {
        onNetworkFilter(networkFilter);
    }, [networkFilter, onNetworkFilter]);

    return (
        <SearchAsset
            searchPlaceholder={translationString(placeholder)}
            search={search}
            setSearch={setSearch}
            selectConfig={{
                networks: enabledNetworks,
                selectedNetwork: networkFilter,
                onChange: setNetworkFilter,
                includeAllOption: true,
                allLabel: translationString('TR_ALL_NETWORKS', {
                    networkCount: enabledNetworks?.length,
                }),
            }}
        />
    );
});
