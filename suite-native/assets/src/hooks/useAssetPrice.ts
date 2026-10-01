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
    selectBaseCurrency,
    selectIsElectrumBackendSelected,
} from '@suite-common/wallet-core';
import {
    type BaseCurrencyAmount,
    type TokenAddress,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

const UNIX_DAY = 24 * 60 * 60;
const REFRESH_INTERVAL = 30_000;

type AssetPriceQueryData = {
    price: BaseCurrencyAmount | null;
    weekAgoPrice: number | null;
    underlyingAssetContract: TokenAddress | null;
};

const NULL_ASSET_PRICE_QUERY_DATA: AssetPriceQueryData = {
    price: null,
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

export type UseAssetPriceQueryParams = UseAssetPriceParams & {
    isErc4626Token?: boolean;
};

export const useAssetPriceQuery = ({
    networkSymbol,
    tokenContract,
    isErc4626Token,
}: UseAssetPriceQueryParams) => {
    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const isElectrumBackend = useSelector((state: BlockchainRootState) =>
        selectIsElectrumBackendSelected(state, networkSymbol ?? asNetworkSymbol('btc')),
    );

    // Block book does not have historical data for tokens of other networks than ETH.
    const isCoingeckoForce = tokenContract && networkSymbol !== 'eth';

    const { data, isLoading } = useQuery<AssetPriceQueryData>({
        enabled: !!networkSymbol,
        queryKey: [
            'asset-price',
            networkSymbol,
            tokenContract,
            isErc4626Token,
            fiatCurrencyCode,
            isElectrumBackend,
            isCoingeckoForce,
        ],
        refetchInterval: REFRESH_INTERVAL,
        queryFn: async () => {
            if (!networkSymbol) return NULL_ASSET_PRICE_QUERY_DATA;

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
                              coin: networkSymbol,
                              contract: tokenContract,
                          })
                        : null;

                const timestampedFiatRates = await getFiatRatesForTimestamps(
                    {
                        symbol: networkSymbol,
                        tokenAddress: underlyingAsset?.contract ?? tokenContract,
                    },
                    [weekAgoTimestamp, currentTimestamp],
                    fiatCurrencyCode,
                    isElectrumBackend,
                    isCoingeckoForce,
                );

                const tickers = timestampedFiatRates?.tickers ?? [];
                const weekAgo = tickers.find(ticker => ticker.ts === weekAgoTimestamp);
                const today = tickers.find(ticker => ticker.ts === currentTimestamp);
                const weekAgoRate = weekAgo?.rates[fiatCurrencyCode];
                const currentRate = today?.rates[fiatCurrencyCode];
                const { weekAgoPrice, currentPrice } = underlyingAsset
                    ? {
                          weekAgoPrice: toVaultSharePrice(
                              weekAgoRate,
                              underlyingAsset.exchangeRate,
                          ),
                          currentPrice: toVaultSharePrice(
                              currentRate,
                              underlyingAsset.exchangeRate,
                          ),
                      }
                    : { weekAgoPrice: weekAgoRate, currentPrice: currentRate };

                const price =
                    currentPrice !== undefined
                        ? asBaseCurrencyAmount(new BigNumber(currentPrice))
                        : null;

                return {
                    price,
                    weekAgoPrice: weekAgoPrice ?? null,
                    underlyingAssetContract: underlyingAsset?.contract ?? null,
                };
            } catch {
                return NULL_ASSET_PRICE_QUERY_DATA;
            }
        },
    });

    const { price, weekAgoPrice, underlyingAssetContract } = data ?? NULL_ASSET_PRICE_QUERY_DATA;

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
        isLoading,
        underlyingAssetContract,
    };
};

export const useAssetPrice = ({ networkSymbol, tokenContract }: UseAssetPriceParams) => {
    const token = useSelector((state: AssetsRootState) =>
        networkSymbol ? selectAssetTokenInfo(state, networkSymbol, tokenContract) : null,
    );
    const { price, sevenDayValueChange, sevenDayPercentageChange } = useAssetPriceQuery({
        networkSymbol,
        tokenContract,
        isErc4626Token: isErc4626(token),
    });

    return { price, sevenDayValueChange, sevenDayPercentageChange };
};
