import styled, { useTheme } from 'styled-components';
import { FiatValue } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { NoRatesTooltip } from './NoRatesTooltip';
import { spacingsPx, typography } from '@trezor/theme';
import { Icon } from '@trezor/components';
import { localizeNumber } from '@suite-common/wallet-utils';

const PercentageWrapper = styled.div<{ isRateGoingUp: boolean }>`
    ${typography.hint}
    gap: ${spacingsPx.xxs};
    display: flex;
    align-items: center;
    color: ${({ theme, isRateGoingUp }) =>
        isRateGoingUp ? theme.textPrimaryDefault : theme.textAlertRed};
`;

interface TickerProps {
    symbol: string;
}
export const TrendTicker = ({ symbol }: TickerProps) => {
    const rates = useSelector(state => state.wallet.fiat.coins.find(r => r.symbol === symbol));
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);
    const locale = useSelector(state => state.suite.settings.language);

    const lastWeekRates = rates?.lastWeek?.tickers ?? [];
    const currentRate = rates?.current?.rates?.[localCurrency];
    const lastWeekRate = lastWeekRates[0]?.rates?.[localCurrency];
    const percentageChange =
        currentRate && lastWeekRate ? (currentRate - lastWeekRate) / (lastWeekRate / 100) : null;
    const isRateGoingUp = percentageChange !== null && percentageChange > 0;
    const theme = useTheme();

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
