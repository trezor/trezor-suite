import styled, { useTheme } from 'styled-components';
import { spacingsPx, typography } from '@trezor/theme';
import { Icon } from '@trezor/components';
import { getFiatRateKey, localizeNumber } from '@suite-common/wallet-utils';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { FiatValue } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { NoRatesTooltip } from './NoRatesTooltip';
import { NetworkSymbol } from '@suite-common/wallet-config';

const PercentageWrapper = styled.div<{ isRateGoingUp: boolean }>`
    ${typography.hint}
    gap: ${spacingsPx.xxs};
    display: flex;
    align-items: center;
    color: ${({ theme, isRateGoingUp }) =>
        isRateGoingUp ? theme.textPrimaryDefault : theme.textAlertRed};
`;

const calculatePercentageDifference = (a: number, b: number) => ((a - b) / b) * 100;

interface TickerProps {
    symbol: NetworkSymbol;
}
export const TrendTicker = ({ symbol }: TickerProps) => {
    const locale = useSelector(state => state.suite.settings.language);
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);
    const lastWeekRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(state, getFiatRateKey(symbol, localCurrency), 'lastWeek'),
    );
    const currentRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(state, getFiatRateKey(symbol, localCurrency), 'current'),
    );

    const theme = useTheme();

    const isSuccessfullyFetched =
        lastWeekRate?.lastSuccessfulFetchTimestamp && currentRate?.lastSuccessfulFetchTimestamp;

    // TODO: create selectIsRateGoingUp selector when wallet.settings is moved to suite-common
    const isRateGoingUp = isSuccessfullyFetched ? currentRate.rate! >= lastWeekRate.rate! : false;
    const percentageChange = isSuccessfullyFetched
        ? calculatePercentageDifference(currentRate.rate!, lastWeekRate.rate!)
        : 0;

    return (
        <FiatValue amount="1" symbol={symbol}>
            {({ rate, timestamp }) =>
                rate && timestamp && percentageChange ? (
                    <PercentageWrapper isRateGoingUp={isRateGoingUp}>
                        <Icon
                            icon={isRateGoingUp ? 'TREND_UP' : 'TREND_DOWN'}
                            color={isRateGoingUp ? theme.iconPrimaryDefault : theme.iconAlertRed}
                            size={16}
                        />
                        {localizeNumber(percentageChange, locale, 1, 1)}%
                    </PercentageWrapper>
                ) : (
                    <NoRatesTooltip />
                )
            }
        </FiatValue>
    );
};
