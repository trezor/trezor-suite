import React from 'react';
import { useSelector } from 'react-redux';

import { Box, Card, Divider, Text, VStack } from '@suite-native/atoms';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Icon } from '@trezor/icons';
import { formatNetworkAmount, isPending, toFiatCurrency } from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { selectFiatCurrency } from '@suite-native/module-settings';

import { TransactionDetailSummary } from './TransactionDetailSummary';

type TransactionDetailDataProps = {
    transaction: WalletAccountTransaction;
};

export const TransactionDetailData = ({ transaction }: TransactionDetailDataProps) => {
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const fiatCurrency = useSelector(selectFiatCurrency);

    const fee = formatNetworkAmount(transaction.fee, transaction.symbol);
    const fiatFeeAmount = toFiatCurrency(fee, fiatCurrency.label, transaction.rates);

    const getBlockTime = () => {
        if (!transaction.blockTime) return '';
        return new Date(transaction.blockTime * 1000).toLocaleTimeString();
    };

    // Only one input and output address for now until UX comes up with design to support multiple outputs
    const transactionOriginAddresses = transaction.details.vin[0].addresses;
    const transactionTargetAddresses = transaction.targets[0].addresses;

    const isTransactionPending = isPending(transaction);

    return (
        <>
            <VStack>
                <Card>
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                        <Text color="gray600">Date</Text>
                        <Box flexDirection="row">
                            <Text color="gray1000">{getBlockTime()}</Text>
                            <Box marginLeft="small">
                                <Icon name="calendar" color="gray1000" />
                            </Box>
                        </Box>
                    </Box>
                </Card>
                <TransactionDetailSummary
                    origin={transactionOriginAddresses && transactionOriginAddresses[0]}
                    target={transactionTargetAddresses && transactionTargetAddresses[0]}
                    transactionStatus={isTransactionPending ? 'pending' : 'confirmed'}
                />
                <Card>
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                        <Text color="gray600">Fee</Text>
                        <Box alignItems="flex-end">
                            <Text color="gray1000">
                                {CryptoAmountFormatter.format(fee, {
                                    symbol: transaction.symbol,
                                })}
                            </Text>
                            <Text variant="hint" color="gray600">
                                {`≈ ${FiatAmountFormatter.format(fiatFeeAmount ?? 0, {
                                    currency: fiatCurrency.label,
                                })}`}
                            </Text>
                        </Box>
                    </Box>
                </Card>
            </VStack>
            <Box marginVertical="medium">
                <Divider />
            </Box>
        </>
    );
};
