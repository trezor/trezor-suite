import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { injectDispatch } from '@suite-common/redux-utils';
import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    updateFiatRatesThunk,
} from '@suite-common/wallet-core';
import { type Timestamp } from '@suite-common/wallet-types';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { selectFiatRateByTradeableAsset } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';
import { useServices } from '@trezor/dependency-injection';

type UseTradeableAssetFiatRateOptions = {
    // Fetches the current rate when the asset or base currency changes. Only needed for assets the
    // wallet may not hold, the wallet keeps rates of its own assets up to date.
    shouldFetchCurrentRate?: boolean;
};

export const useTradeableAssetFiatRate = (
    asset: TradeableAsset | undefined,
    { shouldFetchCurrentRate = false }: UseTradeableAssetFiatRateOptions = {},
): number | undefined => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const rate = useSelector((state: FiatRatesRootState & WalletSettingsRootState) =>
        selectFiatRateByTradeableAsset(state, asset),
    );

    const { dispatch } = useServices(injectDispatch);

    const symbol = getSymbolFromTradeableAsset(asset);
    const contractAddress = asset?.contractAddress;

    useEffect(() => {
        if (!shouldFetchCurrentRate || !symbol) {
            return;
        }

        dispatch(
            updateFiatRatesThunk({
                tickers: [{ symbol, tokenAddress: contractAddress }],
                baseCurrencyCode: baseCurrency,
                rateType: 'current',
                fetchAttemptTimestamp: Date.now() as Timestamp,
                forceFetchToken: true,
                skipCache: true,
            }),
        );
    }, [baseCurrency, contractAddress, dispatch, shouldFetchCurrentRate, symbol]);

    return rate;
};
