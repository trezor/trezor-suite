import React, { useMemo } from 'react';
import styled from 'styled-components';
import Pagination from '@wallet-components/Pagination';
import TransactionItem from '@suite/components/wallet/TransactionItem';
import { AccountTransaction } from 'trezor-connect';

const Wrapper = styled.div``;

const Transactions = styled.div``;

interface Props {
    transactions: AccountTransaction[];
    currentPage: number;
    perPage: number;
    totalPages?: number;
    onPageSelected: (page: number) => void;
}

const TransactionList = ({
    transactions,
    currentPage,
    perPage,
    totalPages,
    onPageSelected,
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
                onPageSelected={onPageSelected}
            />
        </Wrapper>
    );
};

export default TransactionList;
