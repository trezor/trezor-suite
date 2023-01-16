import React from 'react';
import { useSelector } from 'react-redux';

import { selectCoins } from '@suite-common/wallet-core';
import { useFormatters } from '@suite-common/formatters';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Card, Table, Td, Text, Th, Tr, VStack } from '@suite-native/atoms';
import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';
import { FiatCurrency } from '@suite-common/suite-config';

import { TransactionDetailSheet } from './TransactionDetailSheet';

type TransactionDetailValuesSheetProps = {
    isVisible: boolean;
    transaction: WalletAccountTransaction;
    fiatCurrency: FiatCurrency;
    onSheetVisibilityChange: () => void;
};

type TodayHeaderCellProps = {
    historicalPrice: string | number;
    actualPrice: string | number;
};

const TodayHeaderCell = ({ historicalPrice, actualPrice }: TodayHeaderCellProps) => {
    const fiatTotalHistoryNumeric = Number(historicalPrice);
    const fiatTotalActualNumeric = Number(actualPrice);

    const hasPriceIncreased = fiatTotalHistoryNumeric < fiatTotalActualNumeric;
    const renderPercentage = fiatTotalHistoryNumeric !== fiatTotalActualNumeric;
    let percentageDifference;
    if (hasPriceIncreased) {
        percentageDifference = Math.round(
            (fiatTotalHistoryNumeric / 100) * (fiatTotalActualNumeric - fiatTotalHistoryNumeric),
        );
    } else {
        percentageDifference = Math.round(
            (fiatTotalActualNumeric / 100) * (fiatTotalHistoryNumeric - fiatTotalActualNumeric),
        );
    }

    return (
        <Text variant="hint" color="gray600">
            Today{' '}
            {renderPercentage && (
                <Text variant="hint" color={hasPriceIncreased ? 'green' : 'red'}>
                    {`${hasPriceIncreased ? '+' : '-'}${percentageDifference}`}%
                </Text>
            )}
        </Text>
    );
};

export const TransactionDetailValuesSheet = ({
    isVisible,
    onSheetVisibilityChange,
    transaction,
    fiatCurrency,
}: TransactionDetailValuesSheetProps) => {
    const { FiatAmountFormatter } = useFormatters();
    const coins = useSelector(selectCoins);

    const transactionInput = formatNetworkAmount(transaction.amount, transaction.symbol);
    const transactionFee = formatNetworkAmount(transaction.fee, transaction.symbol);
    const transactionTotal = formatNetworkAmount(
        transaction.details.totalOutput,
        transaction.symbol,
    );

    // historical rates
    // TODO: needs refactoring, waiting for new formatters module
    const fiatInputHistoryFormatted = FiatAmountFormatter.format(
        toFiatCurrency(transactionInput, fiatCurrency.label, transaction.rates) ?? 0,
    );
    const fiatFeeHistoryFormatted = FiatAmountFormatter.format(
        toFiatCurrency(transactionFee, fiatCurrency.label, transaction.rates) ?? 0,
    );
    const fiatTotalHistory =
        toFiatCurrency(transactionTotal, fiatCurrency.label, transaction.rates) ?? 0;
    const fiatTotalHistoryFormatted = FiatAmountFormatter.format(fiatTotalHistory);

    // today rates
    // TODO: needs refactoring, waiting for new formatters module
    const actualRates = coins.find(coin => coin.symbol === transaction.symbol);
    const fiatInputActualFormatted = FiatAmountFormatter.format(
        toFiatCurrency(transactionInput, fiatCurrency.label, actualRates?.current?.rates) ?? 0,
    );
    const fiatFeeActualFormatted = FiatAmountFormatter.format(
        toFiatCurrency(transactionFee, fiatCurrency.label, actualRates?.current?.rates) ?? 0,
    );
    const fiatTotalActual =
        toFiatCurrency(transactionTotal, fiatCurrency.label, actualRates?.current?.rates) ?? 0;
    const fiatTotalActualFormatted = FiatAmountFormatter.format(fiatTotalActual);

    return (
        <TransactionDetailSheet
            isVisible={isVisible}
            onVisibilityChange={onSheetVisibilityChange}
            title="Compare values"
            iconName="clockClockwise"
            transactionId={transaction.txid}
        >
            <VStack marginBottom="medium">
                <Card>
                    <Table>
                        <Tr>
                            <Th />
                            <Th>Transaction</Th>
                            <Th>
                                <TodayHeaderCell
                                    historicalPrice={fiatTotalHistory}
                                    actualPrice={fiatTotalActual}
                                />
                            </Th>
                        </Tr>

                        <Tr>
                            <Th>Input</Th>
                            <Td>{fiatInputHistoryFormatted}</Td>
                            <Td>{fiatInputActualFormatted}</Td>
                        </Tr>
                        <Tr>
                            <Th>Fee</Th>
                            <Td>{fiatFeeHistoryFormatted}</Td>
                            <Td>{fiatFeeActualFormatted}</Td>
                        </Tr>
                        <Tr>
                            <Th>Total</Th>
                            <Td>{fiatTotalHistoryFormatted}</Td>
                            <Td>{fiatTotalActualFormatted}</Td>
                        </Tr>
                    </Table>
                </Card>
            </VStack>
        </TransactionDetailSheet>
    );
};
