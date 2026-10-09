import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    useMissingRateTickersQuery,
} from '@suite-common/wallet-core';
import { type TickerId } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

const BTC = asNetworkSymbol('btc');
const BTC_TICKERS: TickerId[] = [{ symbol: BTC }];
const NO_MISSING_TICKERS: TickerId[] = [];

/** The small balance line is a dollar, converted through both bitcoin rates; fetch whichever is missing. */
export const useSmallBalanceThresholdRates = () => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const hasBtcUsdRate = useSelector(
        state =>
            selectFiatRatesByFiatRateKey(state, getFiatRateKey(BTC, 'usd'))?.rate !== undefined,
    );
    const hasBtcBaseCurrencyRate = useSelector(
        state =>
            selectFiatRatesByFiatRateKey(state, getFiatRateKey(BTC, baseCurrency))?.rate !==
            undefined,
    );
    const isConverted = baseCurrency !== 'usd';

    useMissingRateTickersQuery({
        missingRateTickers: isConverted && !hasBtcUsdRate ? BTC_TICKERS : NO_MISSING_TICKERS,
        baseCurrencyCode: 'usd',
    });

    useMissingRateTickersQuery({
        missingRateTickers:
            isConverted && !hasBtcBaseCurrencyRate ? BTC_TICKERS : NO_MISSING_TICKERS,
        baseCurrencyCode: baseCurrency,
    });
};
