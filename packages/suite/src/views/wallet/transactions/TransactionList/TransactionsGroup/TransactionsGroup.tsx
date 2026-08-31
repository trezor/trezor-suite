import { type ReactNode } from 'react';

import { useSelector } from '@suite-common/redux-utils';
import { isTokenDefinitionKnown, selectCoinDefinitions } from '@suite-common/token-definitions';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectHistoricFiatRates } from '@suite-common/wallet-core';
import { type Timestamp, type TokenAddress } from '@suite-common/wallet-types';
import {
    getErc4626Contracts,
    getFiatRateKey,
    isNftTokenTransfer,
    roundTimestampToNearestPastHour,
    sumTransactions,
    sumTransactionsFiat,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Column } from '@trezor/components';

import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { DayHeader } from './DayHeader';

type TransactionsGroupProps = {
    dateKey: string;
    transactions: WalletAccountTransaction[];
    children?: ReactNode;
    symbol: NetworkSymbol;
    account: Account;
    baseCurrencyCode: BaseCurrencyCode;
    index: number;
    isPending: boolean;
};

export const TransactionsGroup = ({
    dateKey,
    symbol,
    account,
    transactions,
    baseCurrencyCode,
    isPending,
    children,
    index,
}: TransactionsGroupProps) => {
    const historicFiatRates = useSelector(selectHistoricFiatRates);
    const tokenDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));
    const totalAmountPerDay = sumTransactions(transactions);
    const totalFiatAmountPerDay = sumTransactionsFiat(
        transactions,
        baseCurrencyCode,
        historicFiatRates,
    );
    const erc4626Contracts = getErc4626Contracts(account.tokens);
    const isMissingFiatRates = transactions.some(tx => {
        const fiatRateKey = getFiatRateKey(tx.symbol, baseCurrencyCode);
        const roundedTimestamp = roundTimestampToNearestPastHour(tx.blockTime as Timestamp);
        const historicCryptoRate = historicFiatRates?.[fiatRateKey]?.[roundedTimestamp];

        const isMissingTokenRate = tx.tokens
            .filter(
                token =>
                    !isNftTokenTransfer(token) &&
                    !erc4626Contracts.has(token.contract.toLowerCase()),
            )
            .some(token => {
                const isTokenKnown = isTokenDefinitionKnown(
                    tokenDefinitions?.data,
                    symbol,
                    token.contract,
                );

                if (!isTokenKnown) return false;

                const tokenFiatRateKey = getFiatRateKey(
                    tx.symbol,
                    baseCurrencyCode,
                    token.contract as TokenAddress,
                );
                const historicTokenRate = historicFiatRates?.[tokenFiatRateKey]?.[roundedTimestamp];

                return historicTokenRate === undefined || historicTokenRate === 0;
            });

        return historicCryptoRate === undefined || historicCryptoRate === 0 || isMissingTokenRate;
    });

    return (
        <Column
            gap={10}
            key={dateKey}
            data-testid={`@wallet/accounts/transaction-list/${isPending ? 'pending' : 'confirmed'}/group/${index}`}
        >
            <DayHeader
                dateKey={dateKey}
                symbol={symbol}
                totalAmount={totalAmountPerDay}
                totalFiatAmountPerDay={totalFiatAmountPerDay}
                localCurrency={baseCurrencyCode}
                isMissingFiatRates={isMissingFiatRates}
            />
            <Column gap={16}>{children}</Column>
        </Column>
    );
};
