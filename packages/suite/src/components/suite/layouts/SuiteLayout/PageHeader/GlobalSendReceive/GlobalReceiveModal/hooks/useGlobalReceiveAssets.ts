import { useEffect, useMemo, useState } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    type TradeableAssetBalances,
    type TradingAssetOption,
    selectTradingExchangeBuyCryptoIds,
    tradingThunks,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { selectTradeableAssetBalances } from 'src/selectors/wallet/tradeableAssetBalancesSelectors';

export type GlobalReceiveAssetCatalogStatus = 'loading' | 'ready' | 'error';

type UseGlobalReceiveAssetsReturn = {
    assets: TradingAssetOption[];
    balances: TradeableAssetBalances;
    networks: NetworkSymbol[];
    catalogStatus: GlobalReceiveAssetCatalogStatus;
    retry: () => void;
};

/**
 * Exposes the tradable asset catalog for the global receive flow.
 * @deprecated Using the trading catalog is only a temporary solution and will be wholly replaced
 * by a new comprehensive data source.
 *
 * - Loads the catalog using `loadAssetCatalogThunk` unless already loaded.
 * - Aborts the request if it's superseded before it resolves.
 * - Filters the assets to those supported by the connected device.
 */
export const useGlobalReceiveAssets = (): UseGlobalReceiveAssetsReturn => {
    const { dispatch } = useServices(injectDispatch);
    const allNetworkSymbols = useSelector(selectSupportedNetworkSymbols);
    const supportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const includedCryptoIds = useSelector(selectTradingExchangeBuyCryptoIds);
    const balances = useSelector(selectTradeableAssetBalances);
    const { buildAssetOptions } = useTradingAssets();
    const areCryptoIdsLoaded = includedCryptoIds.length > 0;

    const [retryCounter, setRetryCounter] = useState(0);
    const [catalogStatus, setCatalogStatus] = useState<GlobalReceiveAssetCatalogStatus>(
        areCryptoIdsLoaded ? 'ready' : 'loading',
    );

    useEffect(() => {
        if (areCryptoIdsLoaded) {
            setCatalogStatus('ready');

            return;
        }

        setCatalogStatus('loading');
        const catalogPromise = dispatch(tradingThunks.loadAssetCatalogThunk());

        void catalogPromise.then(action => {
            if (
                tradingThunks.loadAssetCatalogThunk.fulfilled.match(action) &&
                action.payload.success
            ) {
                setCatalogStatus('ready');
            } else if (
                tradingThunks.loadAssetCatalogThunk.rejected.match(action) &&
                !action.meta.aborted
            ) {
                setCatalogStatus('error');
            }
        });

        return catalogPromise.abort;
    }, [areCryptoIdsLoaded, dispatch, retryCounter]);

    const assets = useMemo(
        () =>
            buildAssetOptions({ includedCryptoIds: new Set(includedCryptoIds) }).assets.filter(
                asset => supportedNetworkSymbols.includes(asset.networkSymbol),
            ),
        [buildAssetOptions, includedCryptoIds, supportedNetworkSymbols],
    );
    const networks = useMemo(() => {
        const networkSymbolsInList = new Set(assets.map(asset => asset.networkSymbol));

        return allNetworkSymbols.filter(networkSymbol => networkSymbolsInList.has(networkSymbol));
    }, [allNetworkSymbols, assets]);

    return {
        assets,
        balances,
        networks,
        catalogStatus,
        retry: () => setRetryCounter(currentCounter => currentCounter + 1),
    };
};
