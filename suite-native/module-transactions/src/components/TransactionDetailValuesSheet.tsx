import { useSelector } from 'react-redux';

import { pipe } from '@mobily/ts-belt';

import { convertCryptoToFiatAmount } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectHistoricFiatRatesByTimestamp,
} from '@suite-common/wallet-core';
import { type Timestamp, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { Card, Table, Td, Text, Th, Tr, VStack } from '@suite-native/atoms';
import {
    CryptoToFiatAmountFormatter,
    PercentageDifferenceFormatter,
} from '@suite-native/formatters';
import { Translation, useTranslate } from '@suite-native/intl';

import { TransactionDetailSheet } from './TransactionDetailSheet';

type TransactionDetailValuesSheetProps = {
    transaction: WalletAccountTransaction;
};

type TodayHeaderCellProps = {
    cryptoValue: string;
    symbol: NetworkSymbol;
    historicRate?: number;
};

const TodayHeaderCell = ({ cryptoValue, symbol, historicRate }: TodayHeaderCellProps) => {
    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, fiatCurrencyCode);
    const currentRates = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    if (!currentRates || !historicRate) return null;

    const fiatTotalHistoryNumeric = pipe(
        convertCryptoToFiatAmount({
            amount: cryptoValue,
            symbol,
            rate: historicRate,
        }) ?? 0,
        Number,
    );
    const fiatTotalActualNumeric = pipe(
        convertCryptoToFiatAmount({
            amount: cryptoValue,
            symbol,
            rate: currentRates?.rate,
        }),
        Number,
    );

    return (
        <Text variant="body-sm" color="contentSecondary">
            <Translation
                id="transactions.TransactionDetailScreen.valuesSheet.today"
                values={{
                    percentageDifference: (
                        <PercentageDifferenceFormatter
                            oldValue={fiatTotalHistoryNumeric}
                            newValue={fiatTotalActualNumeric}
                            variant="body-sm"
                        />
                    ),
                }}
            />
        </Text>
    );
};

export const TransactionDetailValuesSheet = ({
    transaction,
}: TransactionDetailValuesSheetProps) => {
    const { translate } = useTranslate();

    // Fallback to transaction.amount if totalInput is 0, which is the case for XRP transactions
    const totalInput =
        transaction.details.totalInput === '0'
            ? transaction.amount
            : transaction.details.totalInput;

    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(transaction.symbol, fiatCurrencyCode);
    const historicRate = useSelector((state: FiatRatesRootState) =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

    return (
        <TransactionDetailSheet
            sheetName="values"
            title={translate('transactions.detail.sheet.values')}
            iconName="clockClockwise"
            transactionId={transaction.txid}
        >
            <VStack>
                <Card>
                    <Table>
                        <Tr>
                            <Th />
                            <Th>
                                <Translation id="transactions.TransactionDetailScreen.valuesSheet.transaction" />
                            </Th>
                            <Th>
                                <TodayHeaderCell
                                    cryptoValue={transaction.amount}
                                    historicRate={historicRate}
                                    symbol={transaction.symbol}
                                />
                            </Th>
                        </Tr>

                        <Tr>
                            <Th>
                                <Translation id="transactions.TransactionDetailScreen.valuesSheet.input" />
                            </Th>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="body-sm"
                                    value={totalInput}
                                    symbol={transaction.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </Td>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="body-sm"
                                    value={totalInput}
                                    symbol={transaction.symbol}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </Td>
                        </Tr>
                        <Tr>
                            <Th>
                                <Translation id="transactions.TransactionDetailScreen.valuesSheet.fee" />
                            </Th>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="body-sm"
                                    value={transaction.fee}
                                    symbol={transaction.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </Td>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="body-sm"
                                    value={transaction.fee}
                                    symbol={transaction.symbol}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </Td>
                        </Tr>
                        <Tr>
                            <Th>
                                <Translation id="transactions.TransactionDetailScreen.valuesSheet.total" />
                            </Th>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="body-sm"
                                    value={transaction.amount}
                                    symbol={transaction.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </Td>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="body-sm"
                                    value={transaction.amount}
                                    symbol={transaction.symbol}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </Td>
                        </Tr>
                    </Table>
                </Card>
            </VStack>
        </TransactionDetailSheet>
    );
};
