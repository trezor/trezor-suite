import styled from 'styled-components';
import { differenceInMinutes } from 'date-fns';
import { FormattedRelativeTime } from 'react-intl';

import { Tooltip } from '@trezor/components';
import { FiatValue, Translation } from 'src/components/suite';
import { NoRatesTooltip } from './NoRatesTooltip';
import { typography } from '@trezor/theme';

const FiatRateWrapper = styled.span`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    ${typography.hint}
`;

const LastUpdate = styled.div`
    text-transform: none;
`;

interface PriceTickerProps {
    symbol: string;
    tooltipPos?: 'top' | 'bottom';
}
export const PriceTicker = ({ symbol, tooltipPos = 'top' }: PriceTickerProps) => {
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
                        <FiatRateWrapper>{rate}</FiatRateWrapper>
                    </Tooltip>
                ) : (
                    <NoRatesTooltip />
                )
            }
        </FiatValue>
    );
};
