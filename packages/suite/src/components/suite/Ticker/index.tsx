import React from 'react';
import styled from 'styled-components';
import { differenceInMinutes } from 'date-fns';
import { Tooltip, useTheme, variables, Icon } from '@trezor/components';
import { FiatValue, Translation, NoRatesTooltip } from '@suite-components';
import { FormattedRelativeTime } from 'react-intl';
import { useSelector } from '@suite-hooks';

const FiatRateWrapper = styled.span`
    display: flex;
    align-items: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const LastUpdate = styled.div`
    text-transform: none;
`;

interface Props {
    symbol: string;
    tooltipPos?: 'top' | 'bottom';
}
const Ticker = ({ symbol, tooltipPos = 'top' }: Props) => {
    const theme = useTheme();
    const rateAge = (timestamp: number) => differenceInMinutes(new Date(timestamp), new Date());
    const { lastWeekRates, localCurrency } = useSelector(state => ({
        lastWeekRates: state.wallet.fiat.coins.find(r => r.symbol === symbol)?.lastWeek,
        localCurrency: state.wallet.settings.localCurrency,
    }));
    const lastWeekData = lastWeekRates?.tickers ?? [];

    let rateGoingUp = false;

    if (lastWeekData) {
        const firstDataPoint = lastWeekData[0]?.rates?.[localCurrency];
        // sometimes blockbook returns empty rates for too recent timestamp, just try one before
        let lastDataPoint = lastWeekData[lastWeekData.length - 1]?.rates?.[localCurrency];
        lastDataPoint =
            lastDataPoint ?? lastWeekData[lastWeekData.length - 2]?.rates?.[localCurrency];
        if (lastDataPoint && firstDataPoint) {
            rateGoingUp = lastDataPoint > firstDataPoint;
        }
    }

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

export default Ticker;
