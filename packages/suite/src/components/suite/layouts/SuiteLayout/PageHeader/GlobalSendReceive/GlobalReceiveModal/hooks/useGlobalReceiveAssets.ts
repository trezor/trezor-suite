import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { fetchRankedTokenDefinitions } from '@suite-common/token-definitions';
import { type TradeableAssetBalances, type TradingAssetOption } from '@suite-common/trading';
import { type NetworkSymbol, getMainnets } from '@suite-common/wallet-config';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';

import { selectTradeableAssetBalances } from 'src/selectors/wallet/tradeableAssetBalancesSelectors';

import { buildGlobalReceiveAssetOptions } from '../globalReceiveAssetUtils';

export type GlobalReceiveAssetCatalogStatus = 'loading' | 'ready' | 'error';

type UseGlobalReceiveAssetsReturn = {
    assets: TradingAssetOption[];
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
    const networks = useMemo(
        () => supportedMainnets.map(network => network.symbol),
        [supportedMainnets],
    );

    return {
        assets,
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
