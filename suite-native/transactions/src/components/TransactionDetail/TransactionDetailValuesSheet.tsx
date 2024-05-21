import { useSelector } from 'react-redux';

import { pipe } from '@mobily/ts-belt';

import { convertCryptoToFiatAmount } from '@suite-common/formatters';
import { Timestamp, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Card, Table, Td, Text, Th, Tr, VStack } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FiatRatesRootState,
    selectFiatRatesByFiatRateKey,
    selectHistoricFiatRatesByTimestamp,
} from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { selectFiatCurrencyCode } from '@suite-native/settings';
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
    cryptoValue: string;
    network: NetworkSymbol;
    historicRate?: number;
};

const TodayHeaderCell = ({ cryptoValue, network, historicRate }: TodayHeaderCellProps) => {
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(network, fiatCurrencyCode);
    const currentRates = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    if (!currentRates || !historicRate) return null;

    const fiatTotalHistoryNumeric = pipe(
        convertCryptoToFiatAmount({
            value: cryptoValue,
            rate: historicRate,
            network,
        }) ?? 0,
        Number,
    );
    const fiatTotalActualNumeric = pipe(
        convertCryptoToFiatAmount({
            value: cryptoValue,
            rate: currentRates?.rate,
            network,
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
}: TransactionDetailValuesSheetProps) => {
    // Fallback to transaction.amount if totalInput is 0, which is the case for XRP transactions
    const totalInput =
        transaction.details.totalInput === '0'
            ? transaction.amount
            : transaction.details.totalInput;

    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(transaction.symbol, fiatCurrencyCode);
    const historicRate = useSelector((state: FiatRatesRootState) =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

    return (
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
                                    cryptoValue={transaction.amount}
                                    historicRate={historicRate}
                                    network={transaction.symbol}
                                />
                            </Th>
                        </Tr>

                        <Tr>
                            <Th>Input</Th>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="hint"
                                    value={totalInput}
                                    network={transaction.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </Td>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="hint"
                                    value={totalInput}
                                    network={transaction.symbol}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </Td>
                        </Tr>
                        <Tr>
                            <Th>Fee</Th>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="hint"
                                    value={transaction.fee}
                                    network={transaction.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </Td>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="hint"
                                    value={transaction.fee}
                                    network={transaction.symbol}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </Td>
                        </Tr>
                        <Tr>
                            <Th>Total</Th>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="hint"
                                    value={transaction.amount}
                                    network={transaction.symbol}
                                    historicRate={historicRate}
                                    useHistoricRate
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </Td>
                            <Td>
                                <CryptoToFiatAmountFormatter
                                    variant="hint"
                                    value={transaction.amount}
                                    network={transaction.symbol}
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
