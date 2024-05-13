import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';
import { getUnixTime } from 'date-fns';

import { percentageDiff } from '@suite-native/graph';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { selectFiatCurrencyCode } from '@suite-native/settings';
import { BlockchainRootState, selectIsElectrumBackendSelected } from '@suite-common/wallet-core';

const UNIX_DAY = 24 * 60 * 60;
const REFRESH_INTERVAL = 30_000;

export const useDayCoinPriceChange = (networkSymbol?: NetworkSymbol | null) => {
    const [currentValue, setCurrentValue] = useState<number | null>(null);
    const [yesterdayValue, setYesterdayValue] = useState<number | null>(null);
    const [valuePercentageChange, setValuePercentageChange] = useState<number | null>(null);

    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, networkSymbol ?? 'btc'),
    );

    useEffect(() => {
        const getPrices = async () => {
            if (!networkSymbol) return;
            const currentTimestamp = getUnixTime(Date.now());
            const yesterdayTimestamp = currentTimestamp - UNIX_DAY;

            const timestampedFiatRates = await getFiatRatesForTimestamps(
                { symbol: networkSymbol },
                [yesterdayTimestamp, currentTimestamp],
                fiatCurrencyCode,
                isElectrumBackend,
            );

            if (!timestampedFiatRates) return;

            const [yesterday, today] = timestampedFiatRates.tickers;
            setYesterdayValue(yesterday.rates[fiatCurrencyCode] ?? null);
            setCurrentValue(today.rates[fiatCurrencyCode] ?? null);
        };

        getPrices();
        const refreshInterval = setInterval(getPrices, REFRESH_INTERVAL);

        return () => clearInterval(refreshInterval);
    }, [networkSymbol, fiatCurrencyCode, isElectrumBackend]);

    useEffect(() => {
        if (G.isNotNullable(currentValue) && G.isNotNullable(yesterdayValue)) {
            setValuePercentageChange(percentageDiff(yesterdayValue, currentValue));
        }
    }, [currentValue, yesterdayValue]);

    return { currentValue, valuePercentageChange };
};
