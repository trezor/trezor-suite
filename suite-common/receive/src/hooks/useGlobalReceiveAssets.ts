import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { type AssetId } from '@suite-common/tokens';
import { type NetworkSymbol, getMainnets } from '@suite-common/wallet-config';
import {
    selectAllAccountsToList,
    selectDeviceSupportedNetworks,
    selectTransactions,
} from '@suite-common/wallet-core';

import { useRankedTokenDefinitions } from './useRankedTokenDefinitions';
import { getGlobalReceiveAssetKeysWithHistory } from '../getGlobalReceiveAssetKeysWithHistory';
import {
    type GlobalReceiveAssetSections,
    buildGlobalReceiveAssetCatalog,
    getGlobalReceiveAssetSections,
} from '../globalReceiveAssetUtils';
import { selectReceiveAssetBalances } from '../receiveAssetSelectors';

export type GlobalReceiveAssetCatalogStatus = 'loading' | 'ready' | 'error';

export type UseGlobalReceiveAssetsParams = {
    search: string;
    networkSymbols: NetworkSymbol[];
    otherAssetsLimit?: number;
};

type UseGlobalReceiveAssetsReturn = GlobalReceiveAssetSections & {
    assetIds: readonly AssetId[];
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
    const balances = useSelector(selectReceiveAssetBalances);
    const accounts = useSelector(selectAllAccountsToList);
    const transactions = useSelector(selectTransactions);
    const {
        data: definitions,
        isError,
        isFetching,
        refetch,
    } = useRankedTokenDefinitions({
        isFetchEnabled: true,
    });

    const supportedMainnets = useMemo(() => {
        if (isBitcoinOnlyFirmware) {
            return [];
        }

        const supportedSymbols = new Set(supportedNetworkSymbols);

        return getMainnets().filter(network => supportedSymbols.has(network.symbol));
    }, [isBitcoinOnlyFirmware, supportedNetworkSymbols]);
    const catalog = useMemo(
        () =>
            buildGlobalReceiveAssetCatalog({
                networks: supportedMainnets,
                definitions: definitions ?? [],
            }),
        [definitions, supportedMainnets],
    );
    const assetKeysWithHistory = useMemo(
        () =>
            getGlobalReceiveAssetKeysWithHistory({
                accounts,
                networks: supportedMainnets,
                transactions,
            }),
        [accounts, supportedMainnets, transactions],
    );
    const assetSections = useMemo(
        () =>
            getGlobalReceiveAssetSections({
                catalog,
                balances,
                assetKeysWithHistory,
                search,
                networkSymbols,
                otherAssetsLimit,
            }),
        [catalog, balances, assetKeysWithHistory, search, networkSymbols, otherAssetsLimit],
    );
    const networks = useMemo(
        () => supportedMainnets.map(network => network.symbol),
        [supportedMainnets],
    );

    return {
        assetIds: catalog.assetIds,
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
