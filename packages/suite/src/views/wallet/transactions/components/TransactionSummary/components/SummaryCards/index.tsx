import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { variables } from '@trezor/components';
import {
    Translation,
    HiddenPlaceholder,
    FormattedFiatAmount,
    FormattedDate,
} from '@suite-components';
import { sumFiatValueMap } from '@wallet-utils/graphUtils';
import { Account } from '@wallet-types';
import { GraphRange, AggregatedAccountHistory } from '@wallet-types/graph';
import { InfoCard } from './components/InfoCard';

const InfoCardsWrapper = styled.div`
    display: grid;
    margin-top: 20px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-gap: 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        grid-template-columns: 1fr;
    }
`;

const getFormattedLabelLong = (rangeLabel: GraphRange['label']) => {
    switch (rangeLabel) {
        case 'range':
            return <Translation id="TR_RANGE" />;
        case 'all':
            return <Translation id="TR_ALL" />;
        case 'year':
            return <Translation id="TR_DATE_YEAR_LONG" />;
        case 'month':
            return <Translation id="TR_DATE_MONTH_LONG" />;
        case 'week':
            return <Translation id="TR_DATE_WEEK_LONG" />;
        case 'day':
            return <Translation id="TR_DATE_DAY_LONG" />;
        // no default
    }
};

interface Props {
    selectedRange: GraphRange;
    data: AggregatedAccountHistory[];
    dataInterval: [number, number];
    localCurrency: string;
    symbol: Account['symbol'];
    isLoading?: boolean;
    className?: string;
}

const DateWrapper = styled.span`
    white-space: nowrap;
`;

const SummaryCards = ({
    selectedRange,
    data,
    dataInterval,
    localCurrency,
    symbol,
    isLoading,
    className,
}: Props) => {
    const [fromTimestamp, toTimestamp] = dataInterval;
    // aggregate values from shown graph data
    const numOfTransactions = data.reduce((acc, d) => (acc += d.txs), 0);
    const totalSentAmount = data.reduce((acc, d) => acc.plus(d.sent), new BigNumber(0));
    const totalReceivedAmount = data.reduce((acc, d) => acc.plus(d.received), new BigNumber(0));
    const totalSentFiatMap: { [k: string]: string | undefined } = data.reduce(
        (acc, d) => sumFiatValueMap(acc, d.sentFiat),
        {},
    );
    const totalReceivedFiatMap: { [k: string]: string | undefined } = data.reduce(
        (acc, d) => sumFiatValueMap(acc, d.receivedFiat),
        {},
    );

    return (
        <InfoCardsWrapper className={className}>
            <InfoCard
                title={getFormattedLabelLong(selectedRange.label)}
                isLoading={isLoading}
                value={
                    <HiddenPlaceholder>
                        <Translation id="TR_N_TRANSACTIONS" values={{ value: numOfTransactions }} />
                    </HiddenPlaceholder>
                }
                secondaryValue={
                    fromTimestamp && toTimestamp ? (
                        <>
                            <DateWrapper>
                                <FormattedDate value={fromTimestamp * 1000} date /> -
                            </DateWrapper>{' '}
                            <DateWrapper>
                                <FormattedDate value={toTimestamp * 1000} date />
                            </DateWrapper>
                        </>
                    ) : null
                }
            />
            <InfoCard
                title={<Translation id="TR_INCOMING" />}
                value={totalReceivedAmount.toFixed()}
                secondaryValue={
                    totalReceivedFiatMap[localCurrency] ? (
                        <FormattedFiatAmount
                            value={totalReceivedFiatMap[localCurrency]!}
                            currency={localCurrency}
                        />
                    ) : undefined
                }
                symbol={symbol}
                isLoading={isLoading}
                isNumeric
            />
            <InfoCard
                title={<Translation id="TR_OUTGOING" />}
                value={totalSentAmount.negated().toFixed()}
                secondaryValue={
                    totalSentFiatMap[localCurrency] ? (
                        <FormattedFiatAmount
                            value={totalSentFiatMap[localCurrency]!}
                            currency={localCurrency}
                        />
                    ) : undefined
                }
                symbol={symbol}
                isLoading={isLoading}
                isNumeric
            />
        </InfoCardsWrapper>
    );
};

export default SummaryCards;
