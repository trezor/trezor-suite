import { useState, ReactNode } from 'react';
import styled from 'styled-components';
import { Network, WalletAccountTransaction } from 'src/types/wallet';
import { DayHeader } from './DayHeader';
import {
    getFiatRateKey,
    roundTimestampToNearestPastHour,
    sumTransactions,
    sumTransactionsFiat,
} from '@suite-common/wallet-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { selectHistoricFiatRates } from '@suite-common/wallet-core';
import { useSelector } from 'src/hooks/suite';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';

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

interface TransactionsGroupProps {
    dateKey: string;
    transactions: WalletAccountTransaction[];
    children?: ReactNode;
    symbol: Network['symbol'];
    localCurrency: string;
    index: number;
}

export const TransactionsGroup = ({
    dateKey,
    symbol,
    transactions,
    localCurrency,
    children,
    index,
    ...rest
}: TransactionsGroupProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const historicFiatRates = useSelector(selectHistoricFiatRates);
    const totalAmountPerDay = sumTransactions(transactions);
    const totalFiatAmountPerDay = sumTransactionsFiat(
        transactions,
        localCurrency,
        historicFiatRates,
    );
    const isMissingFiatRates = transactions.some(tx => {
        const fiatRateKey = getFiatRateKey(
            tx.symbol,
            localCurrency as FiatCurrencyCode,
            tx.tokens[0]?.contract as TokenAddress,
        );
        const roundedTimestamp = roundTimestampToNearestPastHour(tx.blockTime as Timestamp);
        const historicRate = historicFiatRates?.[fiatRateKey]?.[roundedTimestamp as Timestamp];

        return !historicRate;
    });

    return (
        <TransactionsGroupWrapper
            key={dateKey}
            onMouseEnter={() => setIsHovered(true)}
            data-test={`@wallet/accounts/transaction-list/group/${index}`}
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
                isMissingFiatRates={isMissingFiatRates}
            />
            {children}
        </TransactionsGroupWrapper>
    );
};
