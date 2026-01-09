import { memo } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box } from '@trezor/components';
import { SearchAsset } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useTranslation } from 'src/hooks/suite';

export interface AssetSearchWithNetworkFilterProps {
    placeholder: TranslationKey;
    search: string;
    setSearch: (search: string) => void;
    networkFilter: NetworkSymbol | undefined;
    setNetworkFilter: (networkFilter: NetworkSymbol | undefined) => void;
    networks: NetworkSymbol[];
    dataTestId?: string;
}

export const AssetSearchWithNetworkFilter = memo(function AssetSearchWithNetworkFilterInner({
    placeholder,
    search,
    setSearch,
    networkFilter,
    setNetworkFilter,
    networks,
    dataTestId,
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
                data-testid={dataTestId ? `${dataTestId}/search` : undefined}
            />
        </Box>
    );
});
