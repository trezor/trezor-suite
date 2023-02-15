import React from 'react';
import { useSelector } from 'react-redux';

import { Box, Card, Divider, Text, VStack } from '@suite-native/atoms';
import { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Icon } from '@trezor/icons';
import { isPending } from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import {
    selectTransactionBlockTimeById,
    selectTransactionFirstInputAddress,
    selectTransactionFirstOutputAddress,
    TransactionsRootState,
} from '@suite-common/wallet-core';

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

    // Only one input and output address for now until UX comes up with design to support multiple inputs/outputs.
    const transactionInputAddress = useSelector((state: TransactionsRootState) =>
        selectTransactionFirstInputAddress(state, transaction.txid, accountKey),
    );
    const transactionOutputAddress = useSelector((state: TransactionsRootState) =>
        selectTransactionFirstOutputAddress(state, transaction.txid, accountKey),
    );

    const isTransactionPending = isPending(transaction);

    return (
        <>
            <VStack>
                <Card>
                    <TransactionDetailRow title="Date">
                        <Text variant="hint" color="gray1000">
                            <DateTimeFormatter value={transactionBlockTime} />
                        </Text>
                        <Box marginLeft="small">
                            <Icon name="calendar" size="medium" color="gray1000" />
                        </Box>
                    </TransactionDetailRow>
                </Card>
                <TransactionDetailSummary
                    origin={transactionInputAddress}
                    target={transactionOutputAddress}
                    transactionStatus={isTransactionPending ? 'pending' : 'confirmed'}
                />
                <Card>
                    <TransactionDetailRow title="Fee">
                        <Box alignItems="flex-end">
                            <CryptoAmountFormatter
                                value={transaction.fee}
                                network={transaction.symbol}
                                isBalance={false}
                                variant="body"
                                color="gray1000"
                            />
                            {transaction.rates && (
                                <Box flexDirection="row">
                                    <Text variant="hint" color="gray600">
                                        ≈{' '}
                                    </Text>
                                    <CryptoToFiatAmountFormatter
                                        value={transaction.fee}
                                        network={transaction.symbol}
                                        customRates={transaction.rates}
                                        variant="hint"
                                        color="gray600"
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
