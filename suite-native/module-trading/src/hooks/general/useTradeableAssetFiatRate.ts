import { useSelector } from 'react-redux';

import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    useFiatRate,
} from '@suite-common/wallet-core';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { selectFiatRateByTradeableAsset } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

type UseTradeableAssetFiatRateOptions = {
    // Subscribes to a fresh current rate of the asset in the base currency. Only needed for assets
    // the wallet may not hold, rates of its own assets are subscribed to by the wallet views.
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

    const symbol = getSymbolFromTradeableAsset(asset);

    useFiatRate({
        ticker: symbol ? { symbol, tokenAddress: asset?.contractAddress } : undefined,
        baseCurrencyCode: baseCurrency,
        forceFetchToken: true,
        skipCache: true,
        isDisabled: !shouldFetchCurrentRate,
    });

    return rate;
};
