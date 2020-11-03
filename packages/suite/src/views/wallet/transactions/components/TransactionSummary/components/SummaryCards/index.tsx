import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { FormattedDate } from 'react-intl';
import { variables } from '@trezor/components';
import { Translation, HiddenPlaceholder, FormattedNumber } from '@suite-components';
import { sumFiatValueMap, getFormattedLabelLong } from '@wallet-utils/graphUtils';
import { Account } from '@wallet-types';
import { GraphRange, AggregatedAccountHistory } from '@wallet-types/graph';
import InfoCard from './components/InfoCard';

const InfoCardsWrapper = styled.div`
    display: grid;
    margin-top: 20px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-gap: 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        grid-template-columns: 1fr;
    }
`;

interface Props {
    selectedRange: GraphRange;
    data: AggregatedAccountHistory[];
    dataInterval: [number, number];
    localCurrency: string;
    symbol: Account['symbol'];
    isLoading?: boolean;
    className?: string;
}

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
                            <FormattedDate
                                value={fromTimestamp * 1000}
                                year="numeric"
                                month="short"
                                day="2-digit"
                            />{' '}
                            -{' '}
                            <FormattedDate
                                value={toTimestamp * 1000}
                                year="numeric"
                                month="short"
                                day="2-digit"
                            />
                        </>
                    ) : null
                }
            />
            <InfoCard
                title={<Translation id="TR_INCOMING" />}
                value={totalReceivedAmount.toFixed()}
                secondaryValue={
                    totalReceivedFiatMap[localCurrency] ? (
                        <FormattedNumber
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
                        <FormattedNumber
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
