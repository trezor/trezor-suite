import React, { useState } from 'react';
import styled from 'styled-components';
import { Network, WalletAccountTransaction } from '@wallet-types';
import DayHeader from '../DayHeader';
import { sumTransactions, sumTransactionsFiat } from '@wallet-utils/transactionUtils';

const TransactionsGroupWrapper = styled.div`
    display: flex;
    flex-direction: column;

    & + & {
        margin-top: 36px;
    }
`;

interface Props {
    dateKey: string;
    transactions: WalletAccountTransaction[];
    children?: React.ReactNode;
    symbol: Network['symbol'];
    localCurrency: string;
}

const TransactionsGroup = ({
    dateKey,
    symbol,
    transactions,
    localCurrency,
    children,
    ...rest
}: Props) => {
    const [isHovered, setIsHovered] = useState(false);
    const totalAmountPerDay = sumTransactions(transactions);
    const totalFiatAmountPerDay = sumTransactionsFiat(transactions, localCurrency);
    return (
        <TransactionsGroupWrapper
            key={dateKey}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...rest}
        >
            <DayHeader
                dateKey={dateKey}
                symbol={symbol}
                isHovered={isHovered}
                totalAmount={totalAmountPerDay}
                totalFiatAmountPerDay={totalFiatAmountPerDay}
                txsCount={transactions.length}
                localCurrency={localCurrency}
            />
            {children}
        </TransactionsGroupWrapper>
    );
};

export default TransactionsGroup;
