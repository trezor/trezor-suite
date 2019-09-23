import React, { useMemo } from 'react';
import styled from 'styled-components';
import Pagination from '@wallet-components/Pagination';
import TransactionItem from '@suite/components/wallet/TransactionItem';
import { WalletAccountTransaction } from '@suite/reducers/wallet/transactionReducer';
import { SETTINGS } from '@suite/config/suite';

const Wrapper = styled.div``;

const Transactions = styled.div``;

interface Props {
    transactions: WalletAccountTransaction[];
    currentPage: number;
    totalPages?: number;
    perPage: number;
    onPageSelected: (page: number) => void;
}

const TransactionList = ({
    transactions,
    currentPage,
    totalPages,
    onPageSelected,
    perPage,
}: Props) => {
    const startIndex = (currentPage - 1) * perPage;
    const stopIndex = startIndex + perPage;
    const slicedTransactions = useMemo(() => transactions.slice(startIndex, stopIndex), [
        transactions,
        startIndex,
        stopIndex,
    ]);
    
    return (
        <Wrapper>
            <Transactions>
                {slicedTransactions.map(tx => {
                    return <TransactionItem key={tx.id} {...tx} />;
                })}
            </Transactions>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                isOnLastPage={slicedTransactions.length < SETTINGS.TXS_PER_PAGE}
                onPageSelected={onPageSelected}
            />
        </Wrapper>
    );
};

export default TransactionList;
