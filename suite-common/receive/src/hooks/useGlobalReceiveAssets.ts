import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { fetchRankedTokenDefinitions } from '@suite-common/token-definitions';
import {
    type TradeableAssetBalances,
    type TradeableAssetSearchIndex,
    type TradingAssetOption,
    selectTradeableAssetBalances,
} from '@suite-common/trading';
import { type NetworkSymbol, getMainnets } from '@suite-common/wallet-config';
import {
    selectAllAccountsToList,
    selectDeviceSupportedNetworks,
    selectTransactions,
} from '@suite-common/wallet-core';

import { getGlobalReceiveAssetIdsWithHistory } from '../getGlobalReceiveAssetIdsWithHistory';
import {
    buildGlobalReceiveAssetOptions,
    buildGlobalReceiveAssetSearchIndex,
} from '../globalReceiveAssetUtils';

export type GlobalReceiveAssetCatalogStatus = 'loading' | 'ready' | 'error';

type UseGlobalReceiveAssetsReturn = {
    assets: TradingAssetOption[];
    assetSearchIndex: TradeableAssetSearchIndex<TradingAssetOption>;
    assetIdsWithHistory: ReadonlySet<string>;
    balances: TradeableAssetBalances;
    networks: NetworkSymbol[];
    catalogStatus: GlobalReceiveAssetCatalogStatus;
    retry: () => void;
};

const getCatalogStatus = (isReady: boolean, hasError: boolean): GlobalReceiveAssetCatalogStatus => {
    if (isReady) {
        return 'ready';
    }

    return hasError ? 'error' : 'loading';
};

/**
 * Loads the wallet-independent ranked catalogue once per session, except on Bitcoin-only firmware.
 * Device support is applied locally, never included in the request or cache key.
 */
export const useGlobalReceiveAssets = (): UseGlobalReceiveAssetsReturn => {
    const isBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const supportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const balances = useSelector(selectTradeableAssetBalances);
    const accounts = useSelector(selectAllAccountsToList);
    const transactions = useSelector(selectTransactions);
    const {
        data: definitions,
        isError,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: desktopQueryKeys.rankedTokenDefinitions(),
        queryFn: ({ signal }) => fetchRankedTokenDefinitions({ signal }),
        enabled: !isBitcoinOnlyFirmware,
        staleTime: Infinity,
        gcTime: Infinity,
    });

    const supportedMainnets = useMemo(() => {
        if (isBitcoinOnlyFirmware) {
            return [];
        }

        const supportedSymbols = new Set(supportedNetworkSymbols);

        return getMainnets().filter(network => supportedSymbols.has(network.symbol));
    }, [isBitcoinOnlyFirmware, supportedNetworkSymbols]);
    const assets = useMemo(
        () =>
            buildGlobalReceiveAssetOptions({
                networks: supportedMainnets,
                definitions: definitions ?? [],
            }),
        [definitions, supportedMainnets],
    );
    const assetSearchIndex = useMemo(() => buildGlobalReceiveAssetSearchIndex(assets), [assets]);
    const assetIdsWithHistory = useMemo(
        () =>
            getGlobalReceiveAssetIdsWithHistory({
                accounts,
                networks: supportedMainnets,
                transactions,
            }),
        [accounts, supportedMainnets, transactions],
    );
    const networks = useMemo(
        () => supportedMainnets.map(network => network.symbol),
        [supportedMainnets],
    );

    return {
        assets,
        assetSearchIndex,
        assetIdsWithHistory,
        balances,
        networks,
        catalogStatus: getCatalogStatus(
            isBitcoinOnlyFirmware || definitions !== undefined,
            isError && !isFetching,
        ),
        retry: () => {
            if (!isBitcoinOnlyFirmware) {
                void refetch();
            }
        },
    };
};
