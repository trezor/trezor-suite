import { useSelector } from 'react-redux';

import { type AssetsRootState, selectAssetTokenInfo } from '@suite-common/assets';
import { fetchErc4626UnderlyingAsset } from '@suite-common/fiat-services';
import { useQuery } from '@suite-common/react-query';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type BlockchainRootState,
    type FiatRatesRootState,
    selectActiveBackendType,
    selectBaseCurrency,
    selectCurrentFiatRateByKey,
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

import { fetchLastWeekAssetPrice } from '../utils/fetchLastWeekAssetPrice';

const REFRESH_INTERVAL = 60 * 60 * 1000;

type HistoricalAssetPriceQueryData = {
    weekAgoPrice: number | null;
    underlyingAssetContract: TokenAddress | null;
};

const NULL_HISTORICAL_ASSET_PRICE_QUERY_DATA: HistoricalAssetPriceQueryData = {
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
    isErc4626Token?: boolean;
};

export const useAssetPrice = ({
    networkSymbol,
    tokenContract,
    isErc4626Token: providedIsErc4626Token,
}: UseAssetPriceParams) => {
    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const token = useSelector((state: AssetsRootState) =>
        networkSymbol ? selectAssetTokenInfo(state, networkSymbol, tokenContract) : null,
    );
    const isErc4626Token = providedIsErc4626Token ?? isErc4626(token);
    const backendType = useSelector((state: BlockchainRootState) =>
        networkSymbol ? selectActiveBackendType(state, networkSymbol) : undefined,
    );
    const fiatRateKey = networkSymbol
        ? getFiatRateKey(networkSymbol, fiatCurrencyCode, tokenContract)
        : null;
    const currentFiatRate = useSelector((state: FiatRatesRootState) =>
        fiatRateKey ? selectCurrentFiatRateByKey(state, fiatRateKey) : undefined,
    );
    const currentPrice =
        currentFiatRate?.rate === undefined
            ? null
            : asBaseCurrencyAmount(new BigNumber(currentFiatRate.rate));
    const missingRateTicker: TickerId | null =
        networkSymbol && currentFiatRate?.rate === undefined && !isTestnet(networkSymbol)
            ? {
                  symbol: networkSymbol,
                  tokenAddress: tokenContract,
                  protocols: isErc4626Token ? ['erc4626'] : undefined,
              }
            : null;

    const missingRateQuery = useMissingRateTickersQuery({
        missingRateTickers: missingRateTicker ? [missingRateTicker] : [],
        baseCurrencyCode: fiatCurrencyCode,
    });

    const { data } = useQuery<HistoricalAssetPriceQueryData>({
        enabled: !!networkSymbol,
        queryKey: [
            'asset-price-history',
            networkSymbol,
            tokenContract,
            isErc4626Token,
            fiatCurrencyCode,
            backendType,
        ],
        refetchInterval: REFRESH_INTERVAL,
        queryFn: async () => {
            if (!networkSymbol) return NULL_HISTORICAL_ASSET_PRICE_QUERY_DATA;

            try {
                // Rate providers have no tickers for ERC4626 vault share tokens, so fetch the
                // historical rate of the underlying asset and scale it by the current vault
                // exchange rate. Historical share-to-asset ratios are not available.
                const underlyingAsset =
                    isErc4626Token && tokenContract
                        ? await fetchErc4626UnderlyingAsset({
                              coin: networkSymbol,
                              contract: tokenContract,
                          })
                        : null;

                const weekAgoFiatRate = await fetchLastWeekAssetPrice({
                    networkSymbol,
                    tokenContract: underlyingAsset?.contract ?? tokenContract,
                    fiatCurrencyCode,
                    backendType,
                });
                const weekAgoPrice = underlyingAsset
                    ? toVaultSharePrice(weekAgoFiatRate, underlyingAsset.exchangeRate)
                    : weekAgoFiatRate;

                return {
                    weekAgoPrice: weekAgoPrice ?? null,
                    underlyingAssetContract: underlyingAsset?.contract ?? null,
                };
            } catch {
                return NULL_HISTORICAL_ASSET_PRICE_QUERY_DATA;
            }
        },
    });

    const { weekAgoPrice, underlyingAssetContract } =
        data ?? NULL_HISTORICAL_ASSET_PRICE_QUERY_DATA;

    const sevenDayValueChange =
        currentPrice !== null && weekAgoPrice !== null
            ? asBaseCurrencyAmount(currentPrice.minus(weekAgoPrice))
            : null;
    const sevenDayPercentageChange =
        currentPrice !== null && weekAgoPrice !== null
            ? calculatePercentageChange(currentPrice, weekAgoPrice)
            : null;

    return {
        price: currentPrice,
        sevenDayValueChange,
        sevenDayPercentageChange,
        isLoading: missingRateQuery.isFetching,
        underlyingAssetContract,
    };
};
