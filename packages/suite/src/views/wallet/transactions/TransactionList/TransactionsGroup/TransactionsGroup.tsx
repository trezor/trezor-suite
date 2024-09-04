import { useState, ReactNode } from 'react';
import styled from 'styled-components';
import { WalletAccountTransaction } from 'src/types/wallet';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { DayHeader } from './DayHeader';
import {
    getFiatRateKey,
    isNftTokenTransfer,
    roundTimestampToNearestPastHour,
    sumTransactions,
    sumTransactionsFiat,
} from '@suite-common/wallet-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { selectHistoricFiatRates } from '@suite-common/wallet-core';
import { useSelector } from 'src/hooks/suite';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { isTokenDefinitionKnown, selectCoinDefinitions } from '@suite-common/token-definitions';

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
    symbol: NetworkSymbol;
    localCurrency: FiatCurrencyCode;
    index: number;
    isPending: boolean;
}

export const TransactionsGroup = ({
    dateKey,
    symbol,
    transactions,
    localCurrency,
    isPending,
    children,
    index,
    ...rest
}: TransactionsGroupProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const historicFiatRates = useSelector(selectHistoricFiatRates);
    const tokenDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));
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

        const isMissingTokenRate = tx.tokens
            .filter(token => !isNftTokenTransfer(token))
            .some(token => {
                const isTokenKnown = isTokenDefinitionKnown(
                    tokenDefinitions?.data,
                    symbol,
                    token.contract,
                );

                if (!isTokenKnown) return false;

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
            data-testid={`@wallet/accounts/transaction-list/${isPending ? 'pending' : 'confirmed'}/group/${index}`}
            onMouseLeave={() => setIsHovered(false)}
            {...rest}
        >
            <DayHeader
                dateKey={dateKey}
                symbol={symbol}
                isHovered={isHovered}
                totalAmount={totalAmountPerDay}
                totalFiatAmountPerDay={totalFiatAmountPerDay}
                localCurrency={localCurrency}
                isMissingFiatRates={isMissingFiatRates}
            />
            {children}
        </TransactionsGroupWrapper>
    );
};
