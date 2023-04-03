import React from 'react';
import { useSelector } from 'react-redux';

import { Box, Card, Divider, Text, VStack } from '@suite-native/atoms';
import { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Icon } from '@trezor/icons';
import { useFormatters } from '@suite-common/formatters';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { selectTransactionBlockTimeById, TransactionsRootState } from '@suite-common/wallet-core';

import { TransactionDetailSummary } from './TransactionDetailSummary';
import { TransactionDetailRow } from './TransactionDetailRow';

type TransactionDetailDataProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
};

export const TransactionDetailData = ({ transaction, accountKey }: TransactionDetailDataProps) => {
    const { DateTimeFormatter } = useFormatters();
    const transactionBlockTime = useSelector((state: TransactionsRootState) =>
        selectTransactionBlockTimeById(state, transaction.txid, accountKey),
    );

    return (
        <>
            <VStack>
                <Card>
                    <TransactionDetailRow title="Date">
                        <Text variant="hint">
                            <DateTimeFormatter value={transactionBlockTime} />
                        </Text>
                        <Box marginLeft="small">
                            <Icon name="calendar" size="medium" />
                        </Box>
                    </TransactionDetailRow>
                </Card>
                <TransactionDetailSummary transaction={transaction} accountKey={accountKey} />
                <Card>
                    <TransactionDetailRow title="Fee">
                        <Box alignItems="flex-end">
                            <CryptoAmountFormatter
                                value={transaction.fee}
                                network={transaction.symbol}
                                isBalance={false}
                                variant="body"
                                color="textDefault"
                            />
                            {transaction.rates && (
                                <Box flexDirection="row">
                                    <Text variant="hint" color="textSubdued">
                                        ≈{' '}
                                    </Text>
                                    <CryptoToFiatAmountFormatter
                                        value={transaction.fee}
                                        network={transaction.symbol}
                                        customRates={transaction.rates}
                                        variant="hint"
                                        color="textSubdued"
                                    />
                                </Box>
                            )}
                        </Box>
                    </TransactionDetailRow>
                </Card>
            </VStack>
            <Box marginVertical="medium">
                <Divider />
            </Box>
        </>
    );
};
