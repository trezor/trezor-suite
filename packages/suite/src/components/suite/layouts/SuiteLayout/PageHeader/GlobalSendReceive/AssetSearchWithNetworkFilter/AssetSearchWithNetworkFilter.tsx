import { type RefObject, memo } from 'react';

import { type TranslationKey, useTranslation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { selectFindNetworkSymbolForProtocolDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { type GlobalSendReceiveType } from '@suite-common/wallet-types';
import { SearchAsset } from '@trezor/product-components';

import { useListScrollReset } from 'src/components/suite/asset-picker/hooks';
import { useSelector } from 'src/hooks/suite';
import { selectProtocolSendFormScheme } from 'src/selectors/suite/protocolSelectors';

import { useNetworkFilter } from './hooks/useNetworkFilter';
import { useSearchFilter } from './hooks/useSearchFilter';

export type AssetSearchWithNetworkFilterProps = {
    placeholder: TranslationKey;
    listRef: RefObject<HTMLDivElement | null>;
    modal?: NonNullable<GlobalSendReceiveType>;
    networks?: readonly NetworkSymbol[];
    shouldResetSearchOnNetworkChange?: boolean;
};

export const AssetSearchWithNetworkFilter = memo(function AssetSearchWithNetworkFilterInner({
    placeholder,
    listRef,
    modal,
    networks: providedNetworks,
    shouldResetSearchOnNetworkChange = true,
}: AssetSearchWithNetworkFilterProps) {
    const { findNetworkSymbolForProtocol } = useServices(selectFindNetworkSymbolForProtocolDep);
    const isBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);

    const [search, setSearch] = useSearchFilter();
    const [networkFilter, setNetworkFilter] = useNetworkFilter({
        modal,
        listRef,
        resetSearch: () => setSearch(''),
        availableNetworks: providedNetworks,
        shouldResetSearchOnNetworkChange,
    });
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const protocolScheme = useSelector(selectProtocolSendFormScheme);

    const protocolSymbol = protocolScheme ? findNetworkSymbolForProtocol(protocolScheme) : null;

    const networks = protocolSymbol ? [protocolSymbol] : (providedNetworks ?? enabledNetworks);

    const { translationString } = useTranslation();

    useListScrollReset(listRef, search);

    const selectConfig = isBitcoinOnlyFirmware
        ? undefined
        : {
              networks: [...networks],
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
