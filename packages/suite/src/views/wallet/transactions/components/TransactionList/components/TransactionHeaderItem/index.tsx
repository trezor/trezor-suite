/* eslint-disable radix */
import React from 'react';
import { FormattedDate } from 'react-intl';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { Account } from '@wallet-types';
import { FiatValue, HiddenPlaceholder, Translation } from '@suite-components';
import BigNumber from 'bignumber.js';

const DayHeading = styled.div`
    position: sticky;
    top: 0;
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    min-height: 35px; /* same as height of badge with fiat value plus padding */
    color: ${colors.BLACK50};
    border-bottom: 2px solid ${colors.BLACK96};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding: 5px;
    text-transform: uppercase;
    background: ${colors.WHITE};
    justify-content: space-between;
    align-items: center;

    &:first-child {
        padding-top: 0px;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
    }
`;

const DayAmountWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const DayAmount = styled.div`
    display: flex;

    & + & {
        margin-left: 14px;
    }
`;

const FiatDayAmount = styled(DayAmount)`
    min-width: 100px;
    justify-content: flex-end;
    text-align: right;
    margin-left: 16px;
`;

const DateWrapper = styled.div`
    display: flex;
`;

interface Props {
    dateKey: string;
    parsedDate: Date;
    totalAmountPerDay: BigNumber;
    symbol: Account['symbol'];
}

const TransactionHeaderItem = ({ dateKey, parsedDate, totalAmountPerDay, symbol }: Props) => {
    return (
        <DayHeading>
            {dateKey === 'pending' ? (
                <DateWrapper>
                    <Translation id="TR_PENDING" />
                </DateWrapper>
            ) : (
                <>
                    <DateWrapper>
                        <FormattedDate
                            value={parsedDate ?? undefined}
                            day="numeric"
                            month="long"
                            year="numeric"
                        />
                    </DateWrapper>
                    <DayAmountWrapper>
                        <HiddenPlaceholder>
                            <DayAmount>
                                {totalAmountPerDay.gte(0) && '+'}
                                {totalAmountPerDay.toFixed()} {symbol.toUpperCase()}
                            </DayAmount>
                        </HiddenPlaceholder>
                        {/* TODO: daily deltas are multiplied by current rate instead of the rate for given day. if someone notices. calc average rate of all txs in a day and use that? */}
                        <HiddenPlaceholder>
                            <FiatValue amount={totalAmountPerDay.toFixed()} symbol={symbol}>
                                {({ value }) => value && <FiatDayAmount>{value}</FiatDayAmount>}
                            </FiatValue>
                        </HiddenPlaceholder>
                    </DayAmountWrapper>
                </>
            )}
        </DayHeading>
    );
};

export default TransactionHeaderItem;
