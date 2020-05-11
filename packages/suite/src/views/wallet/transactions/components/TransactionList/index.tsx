import React, { useMemo } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { groupTransactionsByDate, sumTransactions } from '@wallet-utils/transactionUtils';
import { SETTINGS } from '@suite-config';
import { WalletAccountTransaction } from '@wallet-types';
import TransactionItem from './components/TransactionItem/Container';
import Pagination from './components/Pagination';
import DayHeader from './components/DayHeader';
import { Card } from '@suite-components';

const StyledCard = styled(Card)`
    flex-direction: column;
    margin-bottom: 20px;
    padding-bottom: 20px;
`;

const Table = styled.div`
    display: grid;
    grid-template-areas: 'date type target amount fiat';
    grid-template-columns: auto auto 1fr auto auto;
    align-items: center;
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-template-areas:
            'date type target target'
            'date type amount fiat';
        grid-template-columns: auto auto 1fr auto;
    }
`;

const PaginationWrapper = styled.div`
    margin: 10px 0px;
`;

interface Props {
    transactions: WalletAccountTransaction[];
    currentPage: number;
    totalPages?: number;
    perPage: number;
    symbol: WalletAccountTransaction['symbol'];
    onPageSelected: (page: number) => void;
}

const TransactionList = ({
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
        <StyledCard noVerticalPadding>
            <Table>
                {Object.keys(transactionsByDate).map(dateKey => {
                    const totalAmountPerDay = sumTransactions(transactionsByDate[dateKey]);
                    return (
                        <React.Fragment key={dateKey}>
                            <DayHeader
                                dateKey={dateKey}
                                symbol={props.symbol}
                                totalAmount={totalAmountPerDay}
                            />
                            {transactionsByDate[dateKey].map((tx: WalletAccountTransaction) => (
                                <TransactionItem key={tx.txid} transaction={tx} />
                            ))}
                        </React.Fragment>
                    );
                })}
            </Table>
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
    );
};

export default TransactionList;
