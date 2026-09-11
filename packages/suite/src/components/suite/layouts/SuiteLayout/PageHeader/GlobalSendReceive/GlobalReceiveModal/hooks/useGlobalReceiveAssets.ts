import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type TradeableAssetBalances,
    type TradingAssetOption,
    selectTradingExchangeBuyCryptoIds,
    tradingThunks,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkSymbol, getSupportedNetworks } from '@suite-common/wallet-config';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';

import { selectTradeableAssetBalances } from 'src/selectors/wallet/tradeableAssetBalancesSelectors';
import { type AppState } from 'src/types/suite';

export type GlobalReceiveAssetCatalogStatus = 'loading' | 'ready' | 'error';

type UseGlobalReceiveAssetsReturn = {
    assets: TradingAssetOption[];
    balances: TradeableAssetBalances;
    networks: NetworkSymbol[];
    catalogStatus: GlobalReceiveAssetCatalogStatus;
    retry: () => void;
};

export const useGlobalReceiveAssets = (): UseGlobalReceiveAssetsReturn => {
    const dispatch = useDispatch();
    const allNetworkSymbols = getSupportedNetworks();
    const supportedNetworkSymbols = useSelector((state: AppState) =>
        selectDeviceSupportedNetworks(state, allNetworkSymbols),
    );
    const includedCryptoIds = useSelector((state: AppState) =>
        selectTradingExchangeBuyCryptoIds(state, supportedNetworkSymbols),
    );
    const balances = useSelector(selectTradeableAssetBalances);
    const { buildAssetOptions } = useTradingAssets();

    const [retryCounter, setRetryCounter] = useState(0);
    const [catalogStatus, setCatalogStatus] = useState<GlobalReceiveAssetCatalogStatus>(
        includedCryptoIds.length > 0 ? 'ready' : 'loading',
    );

    useEffect(() => {
        if (includedCryptoIds.length > 0) {
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
    }, [dispatch, includedCryptoIds.length, retryCounter]);

    const assets = useMemo(
        () => buildAssetOptions({ includedCryptoIds: new Set(includedCryptoIds) }).assets,
        [buildAssetOptions, includedCryptoIds],
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
