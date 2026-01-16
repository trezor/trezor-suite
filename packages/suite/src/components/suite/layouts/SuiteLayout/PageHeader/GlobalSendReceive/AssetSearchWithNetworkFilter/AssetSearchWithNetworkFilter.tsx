import { RefObject, memo } from 'react';

import { TranslationKey, useTranslation } from '@suite/intl';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { GlobalSendReceiveType } from '@suite-common/wallet-types';
import { Box } from '@trezor/components';
import { SearchAsset } from '@trezor/product-components';

import { useListScrollReset } from 'src/components/suite/asset-picker/hooks';
import { useSelector } from 'src/hooks/suite';

import { useNetworkFilter } from './hooks/useNetworkFilter';
import { useSearchFilter } from './hooks/useSearchFilter';

export type AssetSearchWithNetworkFilterProps = {
    placeholder: TranslationKey;
    listRef: RefObject<HTMLDivElement | null>;
    modal?: NonNullable<GlobalSendReceiveType>;
};

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
    const protocolScheme = useSelector(state => state.protocol.sendForm.scheme);

    const protocolSymbol = protocolScheme ? getNetworkSymbolForProtocol(protocolScheme) : undefined;

    const networks = protocolSymbol ? [protocolSymbol] : enabledNetworks;

    const { translationString } = useTranslation();

    useListScrollReset(listRef, search);

    return (
        <Box padding={{ horizontal: 16 }}>
            <SearchAsset
                searchPlaceholder={translationString(placeholder)}
                search={search}
                setSearch={setSearch}
                selectConfig={{
                    networks,
                    selectedNetwork: networkFilter,
                    onChange: setNetworkFilter,
                    includeAllOption: !protocolSymbol,
                    allLabel: translationString('TR_ALL_NETWORKS'),
                }}
            />
        </Box>
    );
});
