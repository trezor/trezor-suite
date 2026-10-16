import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    useFiatRates,
} from '@suite-common/wallet-core';
import {
    type BaseCurrencyAmount,
    type TickerId,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

const USD_ASSET_THRESHOLD = new BigNumber('0.1');
const BTC_TICKERS: TickerId[] = [{ symbol: asNetworkSymbol('btc') }];

type PreferredCurrencyUsdThresholdRootState = FiatRatesRootState;
type CalculatePreferredCurrencyUsdThresholdParams = {
    baseCurrency: BaseCurrencyCode;
    btcUsdRate: number | undefined;
    btcBaseCurrencyRate: number | undefined;
};

export const calculatePreferredCurrencyUsdThreshold = ({
    baseCurrency,
    btcUsdRate,
    btcBaseCurrencyRate,
}: CalculatePreferredCurrencyUsdThresholdParams): BaseCurrencyAmount | null => {
    if (baseCurrency === 'usd') {
        return asBaseCurrencyAmount(USD_ASSET_THRESHOLD);
    }
    if (!btcUsdRate) {
        return null;
    }

    if (!btcBaseCurrencyRate) {
        return null;
    }

    return asBaseCurrencyAmount(USD_ASSET_THRESHOLD.times(btcBaseCurrencyRate).div(btcUsdRate));
};

export const usePreferredCurrencyUsdThreshold = () => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const btcUsdRate = useSelector((state: PreferredCurrencyUsdThresholdRootState) =>
        selectFiatRatesByFiatRateKey(state, getFiatRateKey(asNetworkSymbol('btc'), 'usd')),
    )?.rate;
    const btcBaseCurrencyRate = useSelector((state: PreferredCurrencyUsdThresholdRootState) =>
        selectFiatRatesByFiatRateKey(state, getFiatRateKey(asNetworkSymbol('btc'), baseCurrency)),
    )?.rate;

    // The USD threshold needs no rates, other currencies convert it through the BTC rates.
    const isUsdBaseCurrency = baseCurrency === 'usd';

    useFiatRates({
        tickers: BTC_TICKERS,
        baseCurrencyCode: 'usd',
        isDisabled: isUsdBaseCurrency,
    });

    useFiatRates({
        tickers: BTC_TICKERS,
        baseCurrencyCode: baseCurrency,
        isDisabled: isUsdBaseCurrency,
    });

    return useMemo(
        () =>
            calculatePreferredCurrencyUsdThreshold({
                baseCurrency,
                btcUsdRate,
                btcBaseCurrencyRate,
            }),
        [baseCurrency, btcUsdRate, btcBaseCurrencyRate],
    );
};
