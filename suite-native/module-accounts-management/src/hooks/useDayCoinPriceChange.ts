import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getUnixTime } from 'date-fns';

import {
    fetchErc4626UnderlyingAsset,
    getFiatRatesForTimestamps,
} from '@suite-common/fiat-services';
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

interface UseDayCoinPriceChangeProps {
    symbol?: NetworkSymbol | null;
    tokenContract?: TokenAddress;
    isErc4626Token?: boolean;
}

export const useDayCoinPriceChange = ({
    symbol,
    tokenContract,
    isErc4626Token,
}: UseDayCoinPriceChangeProps) => {
    const [currentValue, setCurrentValue] = useState<BaseCurrencyAmount | null>(null);
    const [weekAgoValue, setWeekAgoValue] = useState<number | null>(null);
    const [valuePercentageChange, setValuePercentageChange] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, symbol ?? 'btc'),
    );

    // Block book does not have historical data for tokens of other networks than ETH.
    const isCoingeckoForce = tokenContract && symbol !== 'eth';

    useEffect(() => {
        const getPrices = async () => {
            if (!symbol) return;

            setIsLoading(true);

            const currentTimestamp = getUnixTime(Date.now());
            const weekAgoTimestamp = currentTimestamp - 7 * UNIX_DAY;

            try {
                // Rate providers have no tickers for ERC4626 vault share tokens, so fetch the
                // rates of the underlying asset instead and scale them by the vault exchange
                // rate. Both timestamps use the current exchange rate, because historical
                // share-to-asset ratios are not available.
                const underlyingAsset =
                    isErc4626Token && tokenContract
                        ? await fetchErc4626UnderlyingAsset({
                              coin: symbol,
                              contract: tokenContract,
                          })
                        : null;

                const timestampedFiatRates = await getFiatRatesForTimestamps(
                    { symbol, tokenAddress: underlyingAsset?.contract ?? tokenContract },
                    [weekAgoTimestamp, currentTimestamp],
                    fiatCurrencyCode,
                    isElectrumBackend,
                    isCoingeckoForce,
                );

                const [weekAgo, today] = timestampedFiatRates?.tickers ?? [];

                const toVaultRate = (rate: number | undefined) =>
                    rate !== undefined && underlyingAsset
                        ? underlyingAsset.exchangeRate.multipliedBy(rate).toNumber()
                        : rate;

                setWeekAgoValue(toVaultRate(weekAgo?.rates[fiatCurrencyCode]) ?? null);
                const currentRate = toVaultRate(today?.rates[fiatCurrencyCode]);
                setCurrentValue(
                    currentRate !== undefined
                        ? asBaseCurrencyAmount(new BigNumber(currentRate))
                        : null,
                );
            } catch {
                setWeekAgoValue(null);
                setCurrentValue(null);
            } finally {
                setIsLoading(false);
            }
        };

        getPrices();
        const refreshInterval = setInterval(getPrices, REFRESH_INTERVAL);

        return () => clearInterval(refreshInterval);
    }, [
        symbol,
        tokenContract,
        isErc4626Token,
        fiatCurrencyCode,
        isElectrumBackend,
        isCoingeckoForce,
    ]);

    useEffect(() => {
        if (isNotNullOrUndefined(currentValue) && isNotNullOrUndefined(weekAgoValue)) {
            setValuePercentageChange(percentageDiff(weekAgoValue, currentValue.toNumber()));
        } else {
            setValuePercentageChange(null);
        }
    }, [currentValue, weekAgoValue]);

    return { currentValue, valuePercentageChange, isLoading };
};
