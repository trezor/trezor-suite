import { useMemo } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    AssetPriceChart,
    AssetPriceChartRangeSelector,
    useAssetPriceChartState,
} from '@suite/price-chart';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectIsTokenFiatRateAllowed,
} from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { Card, Column, Row, Skeleton, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { BigNumber } from '@trezor/utils';

import { NoRatesTooltip } from '#src/components/suite/Ticker/NoRatesTooltip';
import { useSelector } from '#src/hooks/suite';
import { FiatAmountHeadline } from '#src/views/home/HomeBalance/FiatAmountHeadline';

import { AssetDetailPriceChange } from './AssetDetailPriceChange';

/** The line height of the price headline, so its placeholders keep the card from jumping. */
const PRICE_HEIGHT = 56;

type AssetDetailMarketPriceProps = {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
};

/** What one unit of the asset costs, and how that moved over the week, styled as the Home total. */
export const AssetDetailMarketPrice = ({
    symbol,
    contractAddress,
}: AssetDetailMarketPriceProps) => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const shouldAnimateSkeleton = useSelector(selectShouldAnimateLoadingSkeleton);
    const baseCurrency = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, baseCurrency, contractAddress);
    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));
    const weekAgoRate = useSelector(
        state => selectFiatRatesByFiatRateKey(state, fiatRateKey, 'lastWeek')?.rate,
    );
    // Rates are fetched only for tokens with a known definition, so any other token never gets one.
    const isRateFetched = useSelector(
        state =>
            contractAddress === undefined ||
            selectIsTokenFiatRateAllowed(state, symbol, contractAddress),
    );
    const {
        points,
        isError: isHistoryError,
        isFetching: isHistoryFetching,
        isUnavailable: isChartUnavailable,
        isEmpty: isHistoryEmpty,
    } = useAssetPriceChartState({
        networkSymbol: symbol,
        tokenContract: contractAddress,
    });

    // The query keeps the last history through a range that loads or fails, so the chart and
    // its range picker stay in place.
    const hasHistory = Array.isArray(points) && points.length > 0;

    const rate = currentRate?.rate;
    const isRateMissing = rate === undefined && (!isRateFetched || Boolean(currentRate?.error));
    const isRateLoading = rate === undefined && !isRateMissing;

    const price = useMemo(() => (rate === undefined ? undefined : new BigNumber(rate)), [rate]);
    const weekChange = useMemo(() => {
        if (price === undefined || !weekAgoRate) {
            return undefined;
        }

        const change = price.minus(weekAgoRate);

        return { change, changePercent: change.div(weekAgoRate) };
    }, [price, weekAgoRate]);

    // Without a price the chart is all the card has, so an asset without a history gives the
    // card up to the balance card when the chart shows none: missing, empty, or failed. With no
    // price to wait for, the card waits for the history, so it is never shown and taken away again.
    const isChartMissing =
        isChartUnavailable || isHistoryEmpty || (isHistoryError && !isHistoryFetching);
    const isChartPending = isRateMissing && points === undefined;

    if (price === undefined && !hasHistory && (isChartMissing || isChartPending)) {
        return null;
    }

    return (
        <Card data-testid="@asset-detail/market-price">
            <Column gap={16} alignItems="stretch">
                <Row
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={16}
                    flexWrap="wrap"
                >
                    <Column gap={8} alignItems="flex-start">
                        <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                            <Translation id="TR_ASSET_DETAIL_MARKET_PRICE" />
                        </Text>
                        {price !== undefined && (
                            <FiatAmountHeadline
                                fiatValue={price}
                                isExact
                                data-testid="@asset-detail/market-price/fiat-amount"
                            />
                        )}
                        {isRateLoading && (
                            <Row data-testid="@asset-detail/market-price/skeleton">
                                <Skeleton
                                    width={180}
                                    height={PRICE_HEIGHT}
                                    animate={shouldAnimateSkeleton}
                                />
                            </Row>
                        )}
                        {isRateMissing && (
                            <Row height={PRICE_HEIGHT} alignItems="flex-start">
                                <NoRatesTooltip />
                            </Row>
                        )}
                        {weekChange !== undefined && (
                            <AssetDetailPriceChange
                                change={weekChange.change}
                                changePercent={weekChange.changePercent}
                                data-testid="@asset-detail/market-price/week-change"
                            />
                        )}
                    </Column>
                    <AssetPriceChartRangeSelector
                        networkSymbol={symbol}
                        tokenContract={contractAddress}
                        onRangeChange={timeframe =>
                            analytics.report({
                                type: events.assetsTimeframeChangeEvent.name,
                                payload: {
                                    timeframe,
                                    networkSymbol: symbol,
                                    ...(contractAddress ? { contractAddress } : {}),
                                },
                            })
                        }
                    />
                </Row>
                <AssetPriceChart networkSymbol={symbol} tokenContract={contractAddress} />
            </Column>
        </Card>
    );
};
