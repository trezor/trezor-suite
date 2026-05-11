import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getUnixTime } from 'date-fns';

import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type BlockchainRootState,
    selectBaseCurrency,
    selectIsElectrumBackendSelected,
} from '@suite-common/wallet-core';
import {
    type BaseCurrencyAmount,
    type TokenAddress,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { percentageDiff } from '@suite-native/graph';
import { BigNumber, isNotNullOrUndefined } from '@trezor/utils';

const UNIX_DAY = 24 * 60 * 60;
const REFRESH_INTERVAL = 30_000;

export const useDayCoinPriceChange = (
    symbol?: NetworkSymbol | null,
    tokenContract?: TokenAddress,
) => {
    const [currentValue, setCurrentValue] = useState<BaseCurrencyAmount | null>(null);
    const [weekAgoValue, setWeekAgoValue] = useState<number | null>(null);
    const [valuePercentageChange, setValuePercentageChange] = useState<number | null>(null);

    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, symbol ?? 'btc'),
    );

    useEffect(() => {
        const getPrices = async () => {
            if (!symbol) return;
            const currentTimestamp = getUnixTime(Date.now());
            const weekAgoTimestamp = currentTimestamp - 7 * UNIX_DAY;

            const timestampedFiatRates = await getFiatRatesForTimestamps(
                { symbol, tokenAddress: tokenContract },
                [weekAgoTimestamp, currentTimestamp],
                fiatCurrencyCode,
                isElectrumBackend,
            );

            if (!timestampedFiatRates) return;

            const [weekAgo, today] = timestampedFiatRates.tickers;
            setWeekAgoValue(weekAgo.rates[fiatCurrencyCode] ?? null);

            const currentRate = today.rates[fiatCurrencyCode];
            setCurrentValue(
                currentRate !== undefined ? asBaseCurrencyAmount(new BigNumber(currentRate)) : null,
            );
        };

        getPrices();
        const refreshInterval = setInterval(getPrices, REFRESH_INTERVAL);

        return () => clearInterval(refreshInterval);
    }, [symbol, tokenContract, fiatCurrencyCode, isElectrumBackend]);

    useEffect(() => {
        if (isNotNullOrUndefined(currentValue) && isNotNullOrUndefined(weekAgoValue)) {
            setValuePercentageChange(percentageDiff(weekAgoValue, currentValue.toNumber()));
        }
    }, [currentValue, weekAgoValue]);

    return { currentValue, valuePercentageChange };
};
