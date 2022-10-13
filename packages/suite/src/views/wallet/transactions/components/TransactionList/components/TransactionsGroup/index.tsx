import React, { useState } from 'react';
import styled from 'styled-components';
import { Network, WalletAccountTransaction } from '@wallet-types';
import DayHeader from '../DayHeader';
import { sumTransactions, sumTransactionsFiat } from '@suite-common/wallet-utils';

const TransactionsGroupWrapper = styled.div`
    display: flex;
    flex-direction: column;

    & + & {
        margin-top: 36px;
    }

    > * + * {
        margin-top: 8px;
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
            data-test="@wallet/accounts/transaction-list"
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
