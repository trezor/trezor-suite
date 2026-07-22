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
    autoFocus?: boolean;
}

export const AssetSearchWithNetworkFilter = memo(function AssetSearchWithNetworkFilterInner({
    placeholder,
    search,
    setSearch,
    networkFilter,
    setNetworkFilter,
    networks,
    autoFocus,
}: AssetSearchWithNetworkFilterProps) {
    const { translationString } = useTranslation();

    return (
        <Box padding={{ horizontal: spacings.md }}>
            <SearchAsset
                searchPlaceholder={translationString(placeholder)}
                search={search}
                setSearch={setSearch}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={autoFocus}
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
