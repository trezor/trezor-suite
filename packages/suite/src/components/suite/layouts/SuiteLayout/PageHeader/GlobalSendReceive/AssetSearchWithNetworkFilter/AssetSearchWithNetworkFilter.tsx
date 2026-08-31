import { type RefObject, memo } from 'react';

import { type TranslationKey, useTranslation } from '@suite/intl';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { isNetworkIconSymbol } from '@suite-common/icons';
import { selectNetworkNamesMap, selectNetworkSymbolForProtocol } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { type GlobalSendReceiveType } from '@suite-common/wallet-types';
import { NetworkIcon, SearchAsset, TokenIcon } from '@trezor/product-components';

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
    onNetworkFilterChange?: (networkSymbol: NetworkSymbol | undefined) => void;
    onNetworkFilterOpen?: () => void;
    shouldResetSearchOnNetworkChange?: boolean;
};

export const AssetSearchWithNetworkFilter = memo(function AssetSearchWithNetworkFilterInner({
    placeholder,
    listRef,
    modal,
    networks: providedNetworks,
    onNetworkFilterChange,
    onNetworkFilterOpen,
    shouldResetSearchOnNetworkChange = true,
}: AssetSearchWithNetworkFilterProps) {
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
    const networkNamesMap = useSelector(selectNetworkNamesMap);
    const protocolScheme = useSelector(selectProtocolSendFormScheme);

    const protocolSymbol = useSelector(state =>
        selectNetworkSymbolForProtocol(state, protocolScheme),
    );

    const networks = protocolSymbol ? [protocolSymbol] : (providedNetworks ?? enabledNetworks);

    const { translationString } = useTranslation();

    useListScrollReset(listRef, search);

    const selectConfig = isBitcoinOnlyFirmware
        ? undefined
        : {
              networks: networks.map(symbol => ({
                  symbol,
                  name: networkNamesMap?.[symbol] ?? symbol,
                  icon: isNetworkIconSymbol(symbol) ? (
                      <NetworkIcon size={20} networkSymbol={symbol} />
                  ) : (
                      <TokenIcon size={20} symbol={symbol} />
                  ),
              })),
              selectedNetwork: networkFilter,
              onChange: (networkSymbol: NetworkSymbol | undefined) => {
                  setNetworkFilter(networkSymbol);
                  onNetworkFilterChange?.(networkSymbol);
              },
              includeAllOption: !protocolSymbol,
              allLabel: translationString('TR_ALL_NETWORKS'),
          };

    return (
        <SearchAsset
            searchPlaceholder={translationString(placeholder)}
            search={search}
            setSearch={setSearch}
            selectConfig={selectConfig}
            onMenuOpen={onNetworkFilterOpen}
        />
    );
});
