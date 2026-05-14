import { memo } from 'react';

import { type TranslationKey, useTranslation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box } from '@trezor/components';
import { SearchAsset } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

export interface AssetSearchWithNetworkFilterProps {
    placeholder: TranslationKey;
    search: string;
    setSearch: (search: string) => void;
    networkFilter: NetworkSymbol | undefined;
    setNetworkFilter: (networkFilter: NetworkSymbol | undefined) => void;
    networks: NetworkSymbol[];
}

export const AssetSearchWithNetworkFilter = memo(function AssetSearchWithNetworkFilterInner({
    placeholder,
    search,
    setSearch,
    networkFilter,
    setNetworkFilter,
    networks,
}: AssetSearchWithNetworkFilterProps) {
    const { translationString } = useTranslation();

    return (
        <Box padding={{ horizontal: spacings.md }}>
            <SearchAsset
                searchPlaceholder={translationString(placeholder)}
                search={search}
                setSearch={setSearch}
                selectConfig={{
                    networks,
                    selectedNetwork: networkFilter,
                    onChange: setNetworkFilter,
                    includeAllOption: true,
                    allLabel: translationString('TR_ALL_NETWORKS'),
                }}
            />
        </Box>
    );
});
