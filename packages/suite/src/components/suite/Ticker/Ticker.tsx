import styled, { useTheme } from 'styled-components';
import { differenceInMinutes } from 'date-fns';
import { FormattedRelativeTime } from 'react-intl';

import { Tooltip, variables, Icon } from '@trezor/components';
import { FiatValue, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { NoRatesTooltip } from './NoRatesTooltip';

const FiatRateWrapper = styled.span`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const LastUpdate = styled.div`
    text-transform: none;
`;

interface TickerProps {
    symbol: string;
    tooltipPos?: 'top' | 'bottom';
}
export const Ticker = ({ symbol, tooltipPos = 'top' }: TickerProps) => {
    const rates = useSelector(state => state.wallet.fiat.coins.find(r => r.symbol === symbol));
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);
    const theme = useTheme();

    const lastWeekRates = rates?.lastWeek?.tickers ?? [];
    const currentRate = rates?.current?.rates?.[localCurrency];
    const lastWeekRate = lastWeekRates[0]?.rates?.[localCurrency];
    const rateGoingUp = currentRate && lastWeekRate ? currentRate >= lastWeekRate : false;

    const rateAge = (timestamp: number) => differenceInMinutes(new Date(timestamp), new Date());

    return (
        <FiatValue amount="1" symbol={symbol}>
            {({ rate, timestamp }) =>
                rate && timestamp ? (
                    <Tooltip
                        maxWidth={285}
                        placement={tooltipPos}
                        content={
                            <LastUpdate>
                                <Translation
                                    id="TR_LAST_UPDATE"
                                    values={{
                                        value: (
                                            <FormattedRelativeTime
                                                value={rateAge(timestamp) * 60}
                                                numeric="auto"
                                                updateIntervalInSeconds={10}
                                            />
                                        ),
                                    }}
                                />
                            </LastUpdate>
                        }
                    >
                        <FiatRateWrapper>
                            <Icon
                                icon={rateGoingUp ? 'UP' : 'DOWN'}
                                color={rateGoingUp ? theme.TYPE_GREEN : theme.TYPE_RED}
                            />
                            {rate}
                        </FiatRateWrapper>
                    </Tooltip>
                ) : (
                    <NoRatesTooltip />
                )
            }
        </FiatValue>
    );
};
