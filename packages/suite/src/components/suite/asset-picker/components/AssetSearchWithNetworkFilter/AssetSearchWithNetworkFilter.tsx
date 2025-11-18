import { RefObject, memo, useEffect, useState } from 'react';
import { useDebounce } from 'react-use';

import { TranslationKey } from '@suite-common/intl-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { Box } from '@trezor/components';
import { SearchAsset } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';

export interface AssetSearchWithNetworkFilterProps {
    placeholder: TranslationKey;
    listRef: RefObject<HTMLDivElement | null>;
}

export const AssetSearchWithNetworkFilter = memo(function AssetSearchWithNetworkFilterInner({
    placeholder,
    listRef,
}: AssetSearchWithNetworkFilterProps) {
    const { search: defaultSearch, networkSymbol: defaultNetwork } = useSelector(
        globalSendReceiveFilters.selectors.selectFilters,
    );

    const [search, setSearch] = useState(defaultSearch);
    const [networkFilter, setNetworkFilter] = useState<NetworkSymbol | undefined>(defaultNetwork);
    const enabledNetworks = useSelector(selectEnabledNetworks);

    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    useDebounce(
        () => {
            dispatch(globalSendReceiveFilters.actions.setSearch(search));
        },
        100,
        [search, dispatch],
    );

    useEffect(() => {
        setSearch('');
        dispatch(globalSendReceiveFilters.actions.setNetworkSymbol(networkFilter));

        requestAnimationFrame(() => {
            listRef.current?.scrollTo({ top: 0, behavior: 'instant' });
        });
    }, [dispatch, listRef, networkFilter]);

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
