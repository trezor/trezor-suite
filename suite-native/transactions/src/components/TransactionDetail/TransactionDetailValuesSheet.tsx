import React from 'react';
import { useSelector } from 'react-redux';

import { pipe } from '@mobily/ts-belt';

import { convertCryptoToFiatAmount } from '@suite-common/formatters';
import { FiatRates, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Card, Table, Td, Text, Th, Tr, VStack } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectCoins } from '@suite-common/wallet-core';
import { selectFiatCurrency } from '@suite-native/module-settings';
import {
    CryptoToFiatAmountFormatter,
    PercentageDifferenceFormatter,
} from '@suite-native/formatters';

import { TransactionDetailSheet } from './TransactionDetailSheet';

type TransactionDetailValuesSheetProps = {
    isVisible: boolean;
    transaction: WalletAccountTransaction;
    onSheetVisibilityChange: () => void;
};

type TodayHeaderCellProps = {
    historicalPrice: string;
    actualPrice: string;
    network: NetworkSymbol;
    historicalRates?: FiatRates;
};

const TodayHeaderCell = ({
    historicalPrice,
    actualPrice,
    network,
    historicalRates,
}: TodayHeaderCellProps) => {
    const coins = useSelector(selectCoins);
    const fiatCurrency = useSelector(selectFiatCurrency);
    const currentRates = coins.find(coin => coin.symbol === network)?.current?.rates;

    if (!historicalRates || !currentRates) return null;

    const fiatTotalHistoryNumeric = pipe(
        convertCryptoToFiatAmount({
            value: historicalPrice,
            rates: historicalRates,
            network,
            fiatCurrency: fiatCurrency.label,
        }) ?? 0,
        Number,
    );
    const fiatTotalActualNumeric = pipe(
        convertCryptoToFiatAmount({
            value: actualPrice,
            rates: currentRates,
            network,
            fiatCurrency: fiatCurrency.label,
        }),
        Number,
    );

    return (
        <Text variant="hint" color="textSubdued">
            Today{' '}
            <PercentageDifferenceFormatter
                oldValue={fiatTotalHistoryNumeric}
                newValue={fiatTotalActualNumeric}
                variant="hint"
            />
        </Text>
    );
};

export const TransactionDetailValuesSheet = ({
    isVisible,
    onSheetVisibilityChange,
    transaction,
}: TransactionDetailValuesSheetProps) => (
    <TransactionDetailSheet
        isVisible={isVisible}
        onVisibilityChange={onSheetVisibilityChange}
        title="Compare values"
        iconName="clockClockwise"
        transactionId={transaction.txid}
    >
        <VStack>
            <Card>
                <Table>
                    <Tr>
                        <Th />
                        <Th>Transaction</Th>
                        <Th>
                            <TodayHeaderCell
                                historicalPrice={transaction.details.totalOutput}
                                actualPrice={transaction.details.totalOutput}
                                historicalRates={transaction.rates}
                                network={transaction.symbol}
                            />
                        </Th>
                    </Tr>

                    <Tr>
                        <Th>Input</Th>
                        <Td>
                            <CryptoToFiatAmountFormatter
                                value={transaction.details.totalInput}
                                network={transaction.symbol}
                                customRates={transaction.rates}
                            />
                        </Td>
                        <Td>
                            <CryptoToFiatAmountFormatter
                                value={transaction.details.totalInput}
                                network={transaction.symbol}
                            />
                        </Td>
                    </Tr>
                    <Tr>
                        <Th>Fee</Th>
                        <Td>
                            <CryptoToFiatAmountFormatter
                                value={transaction.fee}
                                network={transaction.symbol}
                                customRates={transaction.rates}
                            />
                        </Td>
                        <Td>
                            <CryptoToFiatAmountFormatter
                                value={transaction.fee}
                                network={transaction.symbol}
                            />
                        </Td>
                    </Tr>
                    <Tr>
                        <Th>Total</Th>
                        <Td>
                            <CryptoToFiatAmountFormatter
                                value={transaction.amount}
                                network={transaction.symbol}
                                customRates={transaction.rates}
                            />
                        </Td>
                        <Td>
                            <CryptoToFiatAmountFormatter
                                value={transaction.amount}
                                network={transaction.symbol}
                            />
                        </Td>
                    </Tr>
                </Table>
            </Card>
        </VStack>
    </TransactionDetailSheet>
);
