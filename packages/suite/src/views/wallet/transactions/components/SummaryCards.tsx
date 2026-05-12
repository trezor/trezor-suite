import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { DISCREET_PLACEHOLDER, useShouldRedactNumbers } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Grid } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { FormattedDate, HiddenPlaceholder } from 'src/components/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { type Account } from 'src/types/wallet';
import { type AggregatedAccountHistory, type GraphRange } from 'src/types/wallet/graph';
import { type FiatValueMap, sumFiatValueMap } from 'src/utils/wallet/graph';

import { InfoCard } from './InfoCard';

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
        default:
            return exhaustive(rangeLabel);
    }
};

type SummaryCardProps = {
    selectedRange: GraphRange;
    data: AggregatedAccountHistory[];
    dataInterval: [number | undefined, number | undefined];
    localCurrency: BaseCurrencyCode;
    account: Account;
    isLoading?: boolean;
};

const DateWrapper = styled.span`
    white-space: nowrap;
`;

const NumberOfTransactions = ({ value }: { value: number }) => (
    <Translation
        id="TR_N_TRANSACTIONS"
        values={{ value: useShouldRedactNumbers() ? DISCREET_PLACEHOLDER : value }}
    />
);

export const SummaryCards = ({
    selectedRange,
    data,
    dataInterval,
    localCurrency,
    account,
    isLoading,
}: SummaryCardProps) => {
    const { isBelowDesktop } = useLayoutSize();
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const [fromTimestamp, toTimestamp] = dataInterval;

    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(account.symbol);

    // aggregate values from shown graph data
    const numOfTransactions = data.reduce((acc, d) => (acc += d.txs), 0) || account.history.total;

    // on some networks it is not easy to get total number of txs (e.g. Ripple & Stellar)
    if (numOfTransactions === -1) {
        return null;
    }

    const totalSentAmount = asBaseCurrencyAmount(
        data.reduce((acc, d) => acc.plus(d.sent), new BigNumber(0)),
    );
    const totalReceivedAmount = asBaseCurrencyAmount(
        data.reduce((acc, d) => acc.plus(d.received), new BigNumber(0)),
    );
    const totalSentFiatMap: FiatValueMap = data.reduce(
        (acc, d) => sumFiatValueMap(acc, d.sentFiat),
        {},
    );
    const totalReceivedFiatMap: FiatValueMap = data.reduce(
        (acc, d) => sumFiatValueMap(acc, d.receivedFiat),
        {},
    );

    return (
        <Grid columns={isBelowDesktop ? 1 : 3} gap={20}>
            <InfoCard
                title={getFormattedLabelLong(selectedRange.label)}
                isLoading={isLoading}
                value={
                    <HiddenPlaceholder>
                        <NumberOfTransactions value={numOfTransactions} />
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
                    shallDisplayBaseCurrency && totalReceivedFiatMap[localCurrency] ? (
                        <BaseCurrencyAmountFormatter
                            currency={localCurrency}
                            value={totalReceivedFiatMap[localCurrency]!}
                        />
                    ) : undefined
                }
                symbol={account.symbol}
                isLoading={isLoading}
                isNumeric
            />
            <InfoCard
                title={<Translation id="TR_OUTGOING" />}
                value={totalSentAmount.negated().toFixed()}
                secondaryValue={
                    shallDisplayBaseCurrency && totalSentFiatMap[localCurrency] ? (
                        <BaseCurrencyAmountFormatter
                            currency={localCurrency}
                            value={totalSentFiatMap[localCurrency]!}
                        />
                    ) : undefined
                }
                symbol={account.symbol}
                isLoading={isLoading}
                isNumeric
            />
        </Grid>
    );
};
