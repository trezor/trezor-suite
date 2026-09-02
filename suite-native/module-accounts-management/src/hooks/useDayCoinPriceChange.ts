import { useSelector } from 'react-redux';

import { getUnixTime } from 'date-fns';

import {
    fetchErc4626UnderlyingAsset,
    getFiatRatesForTimestamps,
} from '@suite-common/fiat-services';
import { useQuery } from '@suite-common/react-query';
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
import { BigNumber } from '@trezor/utils';

const UNIX_DAY = 24 * 60 * 60;
const REFRESH_INTERVAL = 30_000;

type CoinPriceValues = {
    currentValue: BaseCurrencyAmount | null;
    weekAgoValue: number | null;
    underlyingAssetContract: TokenAddress | null;
};

const NULL_PRICE_VALUES: CoinPriceValues = {
    currentValue: null,
    weekAgoValue: null,
    underlyingAssetContract: null,
};

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
    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, symbol ?? 'btc'),
    );

    // Block book does not have historical data for tokens of other networks than ETH.
    const isCoingeckoForce = tokenContract && symbol !== 'eth';

    const { data, isLoading } = useQuery<CoinPriceValues>({
        enabled: !!symbol,
        queryKey: [
            'day-coin-price-change',
            symbol,
            tokenContract,
            isErc4626Token,
            fiatCurrencyCode,
            isElectrumBackend,
            isCoingeckoForce,
        ],
        refetchInterval: REFRESH_INTERVAL,
        queryFn: async () => {
            if (!symbol) return NULL_PRICE_VALUES;

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

                const weekAgoValue = toVaultRate(weekAgo?.rates[fiatCurrencyCode]) ?? null;
                const currentRate = toVaultRate(today?.rates[fiatCurrencyCode]);
                const currentValue =
                    currentRate !== undefined
                        ? asBaseCurrencyAmount(new BigNumber(currentRate))
                        : null;

                return {
                    currentValue,
                    weekAgoValue,
                    underlyingAssetContract: underlyingAsset?.contract ?? null,
                };
            } catch {
                return NULL_PRICE_VALUES;
            }
        },
    });

    const { currentValue, weekAgoValue, underlyingAssetContract } = data ?? NULL_PRICE_VALUES;

    const valuePercentageChange =
        currentValue !== null && weekAgoValue !== null
            ? percentageDiff(weekAgoValue, currentValue.toNumber())
            : null;

    return { currentValue, valuePercentageChange, isLoading, underlyingAssetContract };
};
