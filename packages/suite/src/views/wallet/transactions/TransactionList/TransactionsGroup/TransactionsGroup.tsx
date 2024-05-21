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
    localCurrency: FiatCurrencyCode;
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
        const fiatRateKey = getFiatRateKey(tx.symbol, localCurrency);
        const roundedTimestamp = roundTimestampToNearestPastHour(tx.blockTime as Timestamp);
        const historicCryptoRate = historicFiatRates?.[fiatRateKey]?.[roundedTimestamp];

        const isMissingTokenRate = tx.tokens?.some(token => {
            const tokenFiatRateKey = getFiatRateKey(
                tx.symbol,
                localCurrency,
                token.contract as TokenAddress,
            );
            const historicTokenRate = historicFiatRates?.[tokenFiatRateKey]?.[roundedTimestamp];

            return historicTokenRate === undefined || historicTokenRate === 0;
        });

        return historicCryptoRate === undefined || historicCryptoRate === 0 || isMissingTokenRate;
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
