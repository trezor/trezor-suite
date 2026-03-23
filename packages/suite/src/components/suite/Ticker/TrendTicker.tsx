import styled from 'styled-components';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, localizePercentage } from '@suite-common/wallet-utils';
import { Icon } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/selectors/suite/suiteSelectors';

import { NoRatesTooltip } from './NoRatesTooltip';

const PercentageWrapper = styled.div<{ $isRateGoingUp: boolean }>`
    ${typography['body-sm-strong']}
    gap: ${spacingsPx.xxs};
    display: flex;
    align-items: center;
    color: ${({ theme, $isRateGoingUp }) =>
        $isRateGoingUp ? theme.textPrimaryDefault : theme.textAlertRed};
`;

const Empty = styled.div`
    ${typography['body-sm-strong']}
    color: ${({ theme }) => theme.textSubdued};
`;

const calculatePercentageDifference = (a: number, b: number) => (a - b) / b;

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
    const locale = useSelector(selectLanguage);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, baseCurrencyCode, contractAddress);
    const lastWeekRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey, 'lastWeek'),
    );
    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const isSuccessfullyFetched =
        lastWeekRate?.lastTickerTimestamp && currentRate?.lastTickerTimestamp;

    // TODO: create selectIsRateGoingUp selector when wallet.settings is moved to suite-common
    const isRateGoingUp = isSuccessfullyFetched ? currentRate.rate! >= lastWeekRate.rate! : false;
    const percentageChange = isSuccessfullyFetched
        ? calculatePercentageDifference(currentRate.rate!, lastWeekRate.rate!)
        : 0;

    const emptyStateComponent = noEmptyStateTooltip ? <Empty>—</Empty> : <NoRatesTooltip />;

    return (
        <BaseCurrencyValue amount="1" symbol={symbol} showLoadingSkeleton={showLoadingSkeleton}>
            {({ rate, timestamp }) =>
                rate && timestamp && percentageChange ? (
                    <PercentageWrapper $isRateGoingUp={isRateGoingUp}>
                        <Icon
                            name={isRateGoingUp ? 'trendUp' : 'trendDown'}
                            color={isRateGoingUp ? 'iconPrimaryDefault' : 'iconAlertRed'}
                            size={16}
                        />
                        {localizePercentage({ valueInFraction: percentageChange, locale })}
                    </PercentageWrapper>
                ) : (
                    emptyStateComponent
                )
            }
        </BaseCurrencyValue>
    );
};
