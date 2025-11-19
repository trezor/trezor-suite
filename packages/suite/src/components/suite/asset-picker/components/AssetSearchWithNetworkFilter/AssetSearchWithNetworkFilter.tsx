import { RefObject, memo } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { GlobalSendReceiveType } from '@suite-common/wallet-types';
import { Box } from '@trezor/components';
import { SearchAsset } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useSelector, useTranslation } from 'src/hooks/suite';

import { useNetworkFilter } from './hooks/useNetworkFilter';
import { useSearchFilter } from './hooks/useSearchFilter';

export interface AssetSearchWithNetworkFilterProps {
    placeholder: TranslationKey;
    listRef: RefObject<HTMLDivElement | null>;
    modal: NonNullable<GlobalSendReceiveType>;
}

export const AssetSearchWithNetworkFilter = memo(function AssetSearchWithNetworkFilterInner({
    placeholder,
    listRef,
    modal,
}: AssetSearchWithNetworkFilterProps) {
    const [search, setSearch] = useSearchFilter();
    const [networkFilter, setNetworkFilter] = useNetworkFilter({
        modal,
        listRef,
        resetSearch: () => setSearch(''),
    });
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const { translationString } = useTranslation();

    return (
        <Box padding={{ horizontal: spacings.md }}>
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
        </Box>
    );
});
