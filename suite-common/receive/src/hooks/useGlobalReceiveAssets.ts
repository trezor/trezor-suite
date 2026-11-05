import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import { fetchRankedTokenDefinitions } from '@suite-common/token-definitions';
import { type TradingAssetOption, selectTradeableAssetBalances } from '@suite-common/trading';
import { type NetworkSymbol, getMainnets } from '@suite-common/wallet-config';
import {
    selectAllAccountsToList,
    selectDeviceSupportedNetworks,
    selectTransactions,
} from '@suite-common/wallet-core';

import { getGlobalReceiveAssetIdsWithHistory } from '../getGlobalReceiveAssetIdsWithHistory';
import {
    type GlobalReceiveAssetSections,
    buildGlobalReceiveAssetOptions,
    buildGlobalReceiveAssetSearchIndex,
    getGlobalReceiveAssetSections,
} from '../globalReceiveAssetUtils';

export type GlobalReceiveAssetCatalogStatus = 'loading' | 'ready' | 'error';

export type UseGlobalReceiveAssetsParams = {
    search: string;
    networkSymbols: NetworkSymbol[];
    otherAssetsLimit?: number;
};

type UseGlobalReceiveAssetsReturn = GlobalReceiveAssetSections & {
    assets: TradingAssetOption[];
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
export const useGlobalReceiveAssets = ({
    search,
    networkSymbols,
    otherAssetsLimit,
}: UseGlobalReceiveAssetsParams): UseGlobalReceiveAssetsReturn => {
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
        queryKey: commonQueryKeys.rankedTokenDefinitions(),
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
    const assetSections = useMemo(
        () =>
            getGlobalReceiveAssetSections({
                assets,
                balances,
                assetIdsWithHistory,
                search,
                searchIndex: assetSearchIndex,
                networkSymbols,
                otherAssetsLimit,
            }),
        [
            assets,
            balances,
            assetIdsWithHistory,
            search,
            assetSearchIndex,
            networkSymbols,
            otherAssetsLimit,
        ],
    );
    const networks = useMemo(
        () => supportedMainnets.map(network => network.symbol),
        [supportedMainnets],
    );

    return {
        assets,
        ...assetSections,
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
