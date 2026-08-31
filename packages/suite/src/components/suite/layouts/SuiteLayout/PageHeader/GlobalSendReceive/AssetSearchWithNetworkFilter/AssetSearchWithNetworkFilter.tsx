import { type RefObject, memo } from 'react';

import { type TranslationKey, useTranslation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { selectFindNetworkSymbolForProtocolDep } from '@suite-common/networks';
import { useSelector } from '@suite-common/redux-utils';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { type GlobalSendReceiveType } from '@suite-common/wallet-types';
import { SearchAsset } from '@trezor/product-components';

import { useListScrollReset } from 'src/components/suite/asset-picker/hooks';
import { selectProtocolSendFormScheme } from 'src/selectors/suite/protocolSelectors';

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
    const { findNetworkSymbolForProtocol } = useServices(selectFindNetworkSymbolForProtocolDep);
    const isBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);

    const [search, setSearch] = useSearchFilter();
    const [networkFilter, setNetworkFilter] = useNetworkFilter({
        modal,
        listRef,
        resetSearch: () => setSearch(''),
    });
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const protocolScheme = useSelector(selectProtocolSendFormScheme);

    const protocolSymbol = protocolScheme ? findNetworkSymbolForProtocol(protocolScheme) : null;

    const networks = protocolSymbol ? [protocolSymbol] : enabledNetworks;

    const { translationString } = useTranslation();

    useListScrollReset(listRef, search);

    const selectConfig = isBitcoinOnlyFirmware
        ? undefined
        : {
              networks,
              selectedNetwork: networkFilter,
              onChange: setNetworkFilter,
              includeAllOption: !protocolSymbol,
              allLabel: translationString('TR_ALL_NETWORKS'),
          };

    return (
        <SearchAsset
            searchPlaceholder={translationString(placeholder)}
            search={search}
            setSearch={setSearch}
            selectConfig={selectConfig}
        />
    );
});
