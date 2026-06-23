import styled from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, localizePercentage } from '@suite-common/wallet-utils';
import { Icon, type IconName, Skeleton } from '@trezor/components';
import { type Color, spacingsPx, typography } from '@trezor/theme';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useSelector } from 'src/hooks/suite';

import { NoRatesTooltip } from './NoRatesTooltip';

const PercentageWrapper = styled.div<{ $color: Color }>`
    ${typography['body-sm-strong']}
    gap: ${spacingsPx.xxs};
    display: flex;
    align-items: center;
    color: ${({ theme, $color }) => theme[$color]};
`;

const Empty = styled.div`
    ${typography['body-sm-strong']}
    color: ${({ theme }) => theme.contentSecondary};
`;

type Trend = 'up' | 'down' | 'stable';

const trendStyles: Record<Trend, { icon?: IconName; color: Color }> = {
    up: { icon: 'trendUp', color: 'contentBrand' },
    down: { icon: 'trendDown', color: 'contentCritical' },
    stable: { color: 'contentSecondary' },
};

const calculatePercentageDifference = (a: number, b: number) => (a - b) / b;

// localizePercentage renders 1 decimal place, so a change below this rounds to ±0.0% and should
// be shown as neutral rather than as a tiny up/down move.
const NEUTRAL_TREND_THRESHOLD = 0.0005;

const getTrend = (percentageChange: number): Trend => {
    if (Math.abs(percentageChange) < NEUTRAL_TREND_THRESHOLD) return 'stable';
    if (percentageChange > 0) return 'up';
    if (percentageChange < 0) return 'down';

    return 'stable';
};

interface TickerProps {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    noEmptyStateTooltip?: boolean;
    showLoadingSkeleton?: boolean;
}

export const TrendTicker = ({
    symbol,
    contractAddress,
    noEmptyStateTooltip,
    showLoadingSkeleton = true,
}: TickerProps) => {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);
    const locale = useSelector(selectLanguage);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, baseCurrencyCode, contractAddress);
    const lastWeekRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey, 'lastWeek'),
    );
    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const hasRateError =
        !!currentRate?.error ||
        !!lastWeekRate?.error ||
        // temp fix to avoid showing 0% 7d change
        currentRate?.lastTickerTimestamp === lastWeekRate?.lastTickerTimestamp;

    // lastTickerTimestamp is set even on failed attempts, so check the rate values and error state.
    const isSuccessfullyFetched =
        currentRate?.rate != null && lastWeekRate?.rate != null && !hasRateError;
    // Show the skeleton only while a rate is actually being fetched; an unavailable rate falls through
    // to the empty state instead. Rendered here (not via BaseCurrencyValue, whose skeleton is gated by
    // isTokenKnown and never shows for native coins).
    const isFetching = !!currentRate?.isLoading || !!lastWeekRate?.isLoading;
    if (showLoadingSkeleton && isFetching) {
        return <Skeleton animate={shouldAnimate} />;
    }

    const percentageChange = isSuccessfullyFetched
        ? calculatePercentageDifference(currentRate.rate!, lastWeekRate.rate!)
        : 0;
    const trend = getTrend(percentageChange);
    const { icon, color } = trendStyles[trend];
    // A change that rounds to ±0.0% is shown as a neutral "≈0%" instead of e.g. "-0.0%".
    const formattedChange =
        trend === 'stable'
            ? '≈0%'
            : localizePercentage({ valueInFraction: percentageChange, locale });

    const emptyStateComponent = noEmptyStateTooltip ? <Empty>—</Empty> : <NoRatesTooltip />;

    return (
        <BaseCurrencyValue amount="1" symbol={symbol} showLoadingSkeleton={false}>
            {({ rate, timestamp }) =>
                rate && timestamp && isSuccessfullyFetched ? (
                    <PercentageWrapper $color={color}>
                        {icon !== undefined && <Icon name={icon} color={color} size={16} />}
                        {formattedChange}
                    </PercentageWrapper>
                ) : (
                    emptyStateComponent
                )
            }
        </BaseCurrencyValue>
    );
};
