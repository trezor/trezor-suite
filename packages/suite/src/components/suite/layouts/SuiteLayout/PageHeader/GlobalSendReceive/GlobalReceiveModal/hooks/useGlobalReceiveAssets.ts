import { useEffect, useMemo, useState } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import {
    selectTradingExchangeBuyCryptoIds,
    tradingThunks,
    useTradingAssets,
} from '@suite-common/trading';
import { networkSymbolCollection } from '@suite-common/wallet-config';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { selectTradeableAssetBalances } from 'src/selectors/wallet/tradeableAssetBalancesSelectors';

export type GlobalReceiveAssetCatalogStatus = 'loading' | 'ready' | 'error';

export const useGlobalReceiveAssets = () => {
    const dispatch = useDispatch();
    const supportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const includedCryptoIds = useSelector(state =>
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

        return networkSymbolCollection.filter(networkSymbol =>
            networkSymbolsInList.has(networkSymbol),
        );
    }, [assets]);

    return {
        assets,
        balances,
        networks,
        catalogStatus,
        retry: () => setRetryCounter(currentCounter => currentCounter + 1),
    };
};
