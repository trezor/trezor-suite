import React from 'react';
import styled from 'styled-components';
import { differenceInMinutes } from 'date-fns';
import { Tooltip, useTheme, variables, Icon } from '@trezor/components';
import { FiatValue, Translation, NoRatesTooltip } from 'src/components/suite';
import { FormattedRelativeTime } from 'react-intl';
import { useSelector } from 'src/hooks/suite';

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
    const { rates, localCurrency } = useSelector(state => ({
        rates: state.wallet.fiat.coins.find(r => r.symbol === symbol),
        localCurrency: state.wallet.settings.localCurrency,
    }));
    const lastWeekRates = rates?.lastWeek?.tickers ?? [];
    const currentRate = rates?.current?.rates?.[localCurrency];
    const lastWeekRate = lastWeekRates[0]?.rates?.[localCurrency];
    const rateGoingUp = currentRate && lastWeekRate ? currentRate >= lastWeekRate : false;

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
