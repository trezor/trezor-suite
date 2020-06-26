import React, { useMemo } from 'react';
import styled from 'styled-components';
import { colors, variables, Loader } from '@trezor/components';
import { groupTransactionsByDate, sumTransactions } from '@wallet-utils/transactionUtils';
import { SETTINGS } from '@suite-config';
import { Account, WalletAccountTransaction } from '@wallet-types';
import TransactionItem from './components/TransactionItem';
import Pagination from './components/Pagination';
import { Card, Translation } from '@suite-components';
import DayHeader from './components/DayHeader';

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

const LoaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: center;
    align-items: center;
    margin: 24px 0px;
`;

const LoaderText = styled.div`
    display: flex;
    color: ${colors.BLACK25};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
`;

interface Props {
    account: Account;
    transactions: WalletAccountTransaction[];
    currentPage: number;
    totalPages?: number;
    perPage: number;
    symbol: WalletAccountTransaction['symbol'];
    isLoading?: boolean;
    onPageSelected: (page: number) => void;
}

const TransactionList = ({
    account,
    transactions,
    currentPage,
    totalPages,
    onPageSelected,
    perPage,
    isLoading,
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
            {isLoading ? (
                <LoaderWrapper>
                    <Loader size={28} />
                    <LoaderText>
                        <Translation id="TR_LOADING_TRANSACTIONS" />
                    </LoaderText>
                </LoaderWrapper>
            ) : (
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
                                {transactionsByDate[dateKey].map(tx => (
                                    <TransactionItem
                                        key={tx.txid}
                                        transaction={tx}
                                        account={account}
                                    />
                                ))}
                            </React.Fragment>
                        );
                    })}
                </Table>
            )}
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
