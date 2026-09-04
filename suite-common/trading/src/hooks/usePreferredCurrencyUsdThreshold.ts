import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    useMissingRateTickersQuery,
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
const btcSymbol = asNetworkSymbol('btc');
const BTC_TICKERS: TickerId[] = [{ symbol: btcSymbol }];
const NO_MISSING_TICKERS: TickerId[] = [];

type PreferredCurrencyUsdThresholdRootState = FiatRatesRootState;

export const calculatePreferredCurrencyUsdThreshold = ({
    baseCurrency,
    btcUsdRate,
    btcBaseCurrencyRate,
}: {
    baseCurrency: BaseCurrencyCode;
    btcUsdRate: number | undefined;
    btcBaseCurrencyRate: number | undefined;
}): BaseCurrencyAmount | null => {
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
        selectFiatRatesByFiatRateKey(state, getFiatRateKey(btcSymbol, 'usd')),
    )?.rate;
    const btcBaseCurrencyRate = useSelector((state: PreferredCurrencyUsdThresholdRootState) =>
        selectFiatRatesByFiatRateKey(state, getFiatRateKey(btcSymbol, baseCurrency)),
    )?.rate;

    const isBtcUsdRateMissing = baseCurrency !== 'usd' && btcUsdRate === undefined;
    const isBtcBaseCurrencyRateMissing =
        baseCurrency !== 'usd' && btcBaseCurrencyRate === undefined;

    useMissingRateTickersQuery({
        missingRateTickers: isBtcUsdRateMissing ? BTC_TICKERS : NO_MISSING_TICKERS,
        baseCurrencyCode: 'usd',
    });

    useMissingRateTickersQuery({
        missingRateTickers: isBtcBaseCurrencyRateMissing ? BTC_TICKERS : NO_MISSING_TICKERS,
        baseCurrencyCode: baseCurrency,
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
