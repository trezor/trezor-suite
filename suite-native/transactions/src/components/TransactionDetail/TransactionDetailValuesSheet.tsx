import { useSelector } from 'react-redux';

import { pipe } from '@mobily/ts-belt';

import { convertCryptoToFiatAmount } from '@suite-common/formatters';
import { CurrentFiatRates, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Card, Table, Td, Text, Th, Tr, VStack } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FiatRatesRootState,
    getFiatRateKey,
    selectFiatRatesByFiatRateKey,
} from '@suite-native/fiat-rates';
import { selectFiatCurrencyCode } from '@suite-native/module-settings';
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
    historicalRates?: CurrentFiatRates['rates'];
};

const TodayHeaderCell = ({
    historicalPrice,
    actualPrice,
    network,
    historicalRates,
}: TodayHeaderCellProps) => {
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(network, fiatCurrencyCode);
    const currentRates = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    if (!currentRates || !historicalRates) return null;

    const fiatTotalHistoryNumeric = pipe(
        convertCryptoToFiatAmount({
            value: historicalPrice,
            rates: historicalRates,
            network,
            fiatCurrency: fiatCurrencyCode,
        }) ?? 0,
        Number,
    );
    const fiatTotalActualNumeric = pipe(
        convertCryptoToFiatAmount({
            value: actualPrice,
            rates: { [fiatCurrencyCode]: currentRates?.rate },
            network,
            fiatCurrency: fiatCurrencyCode,
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
                                variant="hint"
                                value={transaction.details.totalInput}
                                network={transaction.symbol}
                                customRates={transaction.rates}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            />
                        </Td>
                        <Td>
                            <CryptoToFiatAmountFormatter
                                variant="hint"
                                value={transaction.details.totalInput}
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
                                customRates={transaction.rates}
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
                                customRates={transaction.rates}
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
