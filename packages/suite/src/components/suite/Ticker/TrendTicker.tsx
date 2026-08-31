import styled from 'styled-components';

import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { useSelector } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { Skeleton } from '@trezor/components';
import { typography } from '@trezor/theme';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';

import { NoRatesTooltip } from './NoRatesTooltip';
import { TrendBadge, calculatePercentageDifference } from './TrendBadge';

const Empty = styled.div`
    ${typography['body-sm-strong']}
    color: ${({ theme }) => theme.contentSecondary};
`;

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

    const emptyStateComponent = noEmptyStateTooltip ? <Empty>—</Empty> : <NoRatesTooltip />;

    return (
        <BaseCurrencyValue amount="1" symbol={symbol} showLoadingSkeleton={false}>
            {({ rate, timestamp }) =>
                rate && timestamp && isSuccessfullyFetched ? (
                    <TrendBadge valueInFraction={percentageChange} />
                ) : (
                    emptyStateComponent
                )
            }
        </BaseCurrencyValue>
    );
};
