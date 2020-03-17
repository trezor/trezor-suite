/* eslint-disable radix */
import React, { useMemo } from 'react';
import { FormattedDate } from 'react-intl';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { groupTransactionsByDate, parseKey, sumTransactions } from '@wallet-utils/transactionUtils';
import { SETTINGS } from '@suite-config';
import { Account, WalletAccountTransaction } from '@wallet-types';
import TransactionItem from './components/TransactionItem/Container';
import Pagination from './components/Pagination';
import { Badge, Card, FiatValue, HiddenPlaceholder, Translation } from '@suite-components';

const Wrapper = styled.div``;

const StyledCard = styled(Card)`
    flex-direction: column;
`;

const Transactions = styled.div`
    flex-direction: column;
`;

const StyledTransactionItem = styled(TransactionItem)`
    & + & {
        border-top: 2px solid ${colors.BLACK96};
    }
`;

const DayHeading = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    min-height: 35px; /* same as height of baddge with fiat value plus padding */
    color: ${colors.BLACK50};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding: 5px 16px;
    text-transform: uppercase;
    background: ${colors.BLACK96};
    justify-content: space-between;
    align-items: center;

    &:first-child {
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
    }
`;

const PaginationWrapper = styled.div`
    margin: 10px 0px;
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
    explorerUrl?: string;
    transactions: WalletAccountTransaction[];
    currentPage: number;
    totalPages?: number;
    perPage: number;
    symbol: Account['symbol'];
    onPageSelected: (page: number) => void;
}

const TransactionList = ({
    explorerUrl,
    transactions,
    currentPage,
    totalPages,
    onPageSelected,
    perPage,
    ...props
}: Props) => {
    const startIndex = (currentPage - 1) * perPage;
    const stopIndex = startIndex + perPage;

    const slicedTransactions = useMemo(() => transactions.slice(startIndex, stopIndex), [
        transactions,
        startIndex,
        stopIndex,
    ]);

    const transactionsByDate = useMemo(() => groupTransactionsByDate(slicedTransactions), [
        slicedTransactions,
    ]);

    // if totalPages is 1 do not render pagination
    // if totalPages is undefined check current page and number of txs (e.g. XRP)
    // Edge case: if there is exactly 25 txs, pagination will be displayed
    const isOnLastPage = slicedTransactions.length < SETTINGS.TXS_PER_PAGE;
    const shouldShowRipplePagination = !(currentPage === 1 && isOnLastPage);
    const showPagination = totalPages ? totalPages > 1 : shouldShowRipplePagination;
    return (
        <Wrapper>
            <StyledCard>
                <Transactions>
                    {Object.keys(transactionsByDate).map(dateKey => {
                        const parsedDate = parseKey(dateKey);
                        const totalAmountPerDay = sumTransactions(transactionsByDate[dateKey]);
                        return (
                            <React.Fragment key={dateKey}>
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
                                                        {totalAmountPerDay.toFixed()}{' '}
                                                        {props.symbol.toUpperCase()}
                                                    </DayAmount>
                                                </HiddenPlaceholder>
                                                {/* PRDIM NA TO */}
                                                {/* TODO: calc average rate of all txs in a day and use that? */}
                                                <HiddenPlaceholder>
                                                    <FiatValue
                                                        amount={totalAmountPerDay.toFixed()}
                                                        symbol={props.symbol}
                                                    >
                                                        {({ value }) =>
                                                            value && (
                                                                <FiatDayAmount>
                                                                    <Badge>{value}</Badge>
                                                                </FiatDayAmount>
                                                            )
                                                        }
                                                    </FiatValue>
                                                </HiddenPlaceholder>
                                            </DayAmountWrapper>
                                        </>
                                    )}
                                </DayHeading>
                                {transactionsByDate[dateKey].map((tx: WalletAccountTransaction) => (
                                    <StyledTransactionItem key={tx.txid} transaction={tx} />
                                ))}
                            </React.Fragment>
                        );
                    })}
                </Transactions>
                {showPagination && (
                    <PaginationWrapper>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            isOnLastPage={isOnLastPage}
                            onPageSelected={onPageSelected}
                        />
                    </PaginationWrapper>
                )}
            </StyledCard>
        </Wrapper>
    );
};

export default TransactionList;
