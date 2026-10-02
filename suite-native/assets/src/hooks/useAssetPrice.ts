import { useSelector } from 'react-redux';

import { getUnixTime } from 'date-fns';

import { type AssetsRootState, selectAssetTokenInfo } from '@suite-common/assets';
import {
    fetchErc4626UnderlyingAsset,
    getFiatRatesForTimestamps,
} from '@suite-common/fiat-services';
import { useQuery } from '@suite-common/react-query';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type BlockchainRootState,
    type FiatRatesRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectIsElectrumBackendSelected,
    useMissingRateTickersQuery,
} from '@suite-common/wallet-core';
import {
    type BaseCurrencyAmount,
    type TickerId,
    type TokenAddress,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { getFiatRateKey, isErc4626, isTestnet } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

const UNIX_DAY = 24 * 60 * 60;
const HISTORICAL_PRICE_REFRESH_INTERVAL = 60 * 60 * 1000;
const NO_MISSING_RATE_TICKERS: TickerId[] = [];

type AssetHistoricalPriceQueryData = {
    weekAgoPrice: number | null;
    underlyingAssetContract: TokenAddress | null;
};

const NULL_ASSET_HISTORICAL_PRICE_QUERY_DATA: AssetHistoricalPriceQueryData = {
    weekAgoPrice: null,
    underlyingAssetContract: null,
};

const toVaultSharePrice = (rate: number | undefined, exchangeRate: BigNumber) =>
    rate === undefined ? undefined : exchangeRate.multipliedBy(rate).toNumber();

const calculatePercentageChange = (currentPrice: BaseCurrencyAmount, previousPrice: number) =>
    previousPrice === 0 ? 0 : currentPrice.minus(previousPrice).dividedBy(previousPrice).toNumber();

export type UseAssetPriceParams = {
    networkSymbol?: NetworkSymbol | null;
    tokenContract?: TokenAddress;
};

export type UseAssetPriceDataParams = UseAssetPriceParams & {
    isErc4626Token?: boolean;
};

export const useAssetPriceData = ({
    networkSymbol,
    tokenContract,
    isErc4626Token,
}: UseAssetPriceDataParams) => {
    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, networkSymbol ?? asNetworkSymbol('btc')),
    );
    const fiatRateKey = networkSymbol
        ? getFiatRateKey(networkSymbol, fiatCurrencyCode, tokenContract)
        : null;
    const currentFiatRate = useSelector((state: FiatRatesRootState) =>
        fiatRateKey ? selectFiatRatesByFiatRateKey(state, fiatRateKey) : undefined,
    );
    const currentFiatRateValue = currentFiatRate?.rate ?? null;

    const missingRateTickers: TickerId[] =
        !networkSymbol || currentFiatRateValue !== null || isTestnet(networkSymbol)
            ? NO_MISSING_RATE_TICKERS
            : [
                  {
                      symbol: networkSymbol,
                      tokenAddress: tokenContract,
                      protocols: isErc4626Token ? ['erc4626'] : undefined,
                  },
              ];

    const { isLoading: isMissingRateLoading } = useMissingRateTickersQuery({
        missingRateTickers,
        baseCurrencyCode: fiatCurrencyCode,
    });

    // Block book does not have historical data for tokens of other networks than ETH.
    const isCoingeckoForce = tokenContract && networkSymbol !== 'eth';

    const { data, isLoading: isHistoricalPriceLoading } = useQuery<AssetHistoricalPriceQueryData>({
        enabled: !!networkSymbol,
        queryKey: [
            'asset-historical-price',
            networkSymbol,
            tokenContract,
            isErc4626Token,
            fiatCurrencyCode,
            isElectrumBackend,
            isCoingeckoForce,
        ],
        staleTime: HISTORICAL_PRICE_REFRESH_INTERVAL,
        refetchInterval: HISTORICAL_PRICE_REFRESH_INTERVAL,
        queryFn: async () => {
            if (!networkSymbol) return NULL_ASSET_HISTORICAL_PRICE_QUERY_DATA;

            const weekAgoTimestamp = getUnixTime(Date.now()) - 7 * UNIX_DAY;

            try {
                // Rate providers have no tickers for ERC4626 vault share tokens, so fetch the
                // rate of the underlying asset instead and scale it by the current vault exchange
                // rate because historical share-to-asset ratios are not available.
                const underlyingAsset =
                    isErc4626Token && tokenContract
                        ? await fetchErc4626UnderlyingAsset({
                              coin: networkSymbol,
                              contract: tokenContract,
                          })
                        : null;

                const weekAgoFiatRates = await getFiatRatesForTimestamps(
                    {
                        symbol: networkSymbol,
                        tokenAddress: underlyingAsset?.contract ?? tokenContract,
                    },
                    [weekAgoTimestamp],
                    fiatCurrencyCode,
                    isElectrumBackend,
                    isCoingeckoForce,
                );

                const weekAgoRate = weekAgoFiatRates?.tickers[0]?.rates[fiatCurrencyCode];
                const weekAgoPrice = underlyingAsset
                    ? toVaultSharePrice(weekAgoRate, underlyingAsset.exchangeRate)
                    : weekAgoRate;

                return {
                    weekAgoPrice: weekAgoPrice ?? null,
                    underlyingAssetContract: underlyingAsset?.contract ?? null,
                };
            } catch (error) {
                console.warn('Failed to fetch historical asset price.', error);

                return NULL_ASSET_HISTORICAL_PRICE_QUERY_DATA;
            }
        },
    });

    const price =
        currentFiatRateValue !== null
            ? asBaseCurrencyAmount(new BigNumber(currentFiatRateValue))
            : null;
    const { weekAgoPrice, underlyingAssetContract } =
        data ?? NULL_ASSET_HISTORICAL_PRICE_QUERY_DATA;

    const sevenDayValueChange =
        price !== null && weekAgoPrice !== null
            ? asBaseCurrencyAmount(price.minus(weekAgoPrice))
            : null;
    const sevenDayPercentageChange =
        price !== null && weekAgoPrice !== null
            ? calculatePercentageChange(price, weekAgoPrice)
            : null;

    return {
        price,
        sevenDayValueChange,
        sevenDayPercentageChange,
        isLoading: currentFiatRate?.isLoading || isMissingRateLoading || isHistoricalPriceLoading,
        underlyingAssetContract,
    };
};

export const useAssetPrice = ({ networkSymbol, tokenContract }: UseAssetPriceParams) => {
    const token = useSelector((state: AssetsRootState) =>
        networkSymbol ? selectAssetTokenInfo(state, networkSymbol, tokenContract) : null,
    );
    const { price, sevenDayValueChange, sevenDayPercentageChange } = useAssetPriceData({
        networkSymbol,
        tokenContract,
        isErc4626Token: isErc4626(token),
    });

    return { price, sevenDayValueChange, sevenDayPercentageChange };
};
