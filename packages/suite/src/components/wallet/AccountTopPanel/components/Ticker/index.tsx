import React from 'react';
import styled from 'styled-components';
import { differenceInMinutes } from 'date-fns';
import { Tooltip, colors, variables, Icon } from '@trezor/components';
import { FiatValue, Translation, NoRatesTooltip } from '@suite-components';
import messages from '@suite/support/messages';
import { FormattedRelativeTime } from 'react-intl';
import { useSelector } from '@suite-hooks';

const FiatRateWrapper = styled.span`
    display: flex;
    align-items: center;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const LastUpdate = styled.div`
    text-transform: none;
`;

interface Props {
    symbol: string;
}
const Ticker = ({ symbol }: Props) => {
    const rateAge = (timestamp: number) => differenceInMinutes(new Date(timestamp), new Date());
    const lastWeekRates = useSelector(state => state.wallet.fiat.coins).find(
        r => r.symbol === symbol,
    )?.lastWeek;
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);
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
                        placement="top"
                        content={
                            <LastUpdate>
                                <Translation
                                    {...messages.TR_LAST_UPDATE}
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
                                color={rateGoingUp ? colors.NEUE_TYPE_GREEN : colors.NEUE_TYPE_RED}
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
