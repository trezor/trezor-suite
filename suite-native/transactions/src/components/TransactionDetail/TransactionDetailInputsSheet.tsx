import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@trezor/icons';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Box, Card, Text, VStack } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { formatNetworkAmount } from '@suite-common/wallet-utils';

import { TransactionDetailSheet } from './TransactionDetailSheet';

type TransactionDetailInputsSheetProps = {
    isVisible: boolean;
    transaction: WalletAccountTransaction;
    onSheetVisibilityChange: () => void;
};

type TransactionAddressAmountProps = {
    address: string;
    amount: string;
};

const addressAmountColumnStyle = prepareNativeStyle(_ => ({
    maxWidth: '42.5%',
}));

const TransactionAddressAmount = ({ address, amount }: TransactionAddressAmountProps) => (
    <Box>
        <Text variant="hint" color="gray1000" numberOfLines={1} ellipsizeMode="middle">
            {address}
        </Text>
        <Text variant="label" color="gray600">
            {amount}
        </Text>
    </Box>
);

export const TransactionDetailInputsSheet = ({
    isVisible,
    onSheetVisibilityChange,
    transaction,
}: TransactionDetailInputsSheetProps) => {
    const { applyStyle } = useNativeStyles();
    const { CryptoAmountFormatter } = useFormatters();

    const txInputs = transaction.details.vin;
    const txOutputs = transaction.details.vin;

    // TODO: needs refactoring, waiting for new formatters module
    const formatCryptoInputAmount = (amount?: string) =>
        CryptoAmountFormatter.format(formatNetworkAmount(amount ?? '0', transaction.symbol), {
            symbol: transaction.symbol,
        });
    return (
        <TransactionDetailSheet
            isVisible={isVisible}
            onVisibilityChange={onSheetVisibilityChange}
            title="Inpust & Outputs"
            iconName="swap"
            transactionId={transaction.txid}
        >
            <Box
                flexDirection="row"
                justifyContent="space-between"
                marginHorizontal="small"
                marginBottom="medium"
            >
                <Box flex={1} flexDirection="row" alignItems="center" paddingLeft="small">
                    <Text variant="hint" color="gray600">
                        Inputs · {txInputs.length}
                    </Text>
                    <Box marginLeft="small">
                        <Icon name="receiveAlt" color="gray600" size="medium" />
                    </Box>
                </Box>

                <Box flex={1} flexDirection="row" alignItems="center" paddingLeft="large">
                    <Text variant="hint" color="gray600">
                        Outputs · {txOutputs.length}
                    </Text>
                    <Box marginLeft="small">
                        <Icon name="sendAlt" color="gray600" size="medium" />
                    </Box>
                </Box>
            </Box>
            <VStack marginBottom="medium">
                <Card>
                    <Box flexDirection="row" justifyContent="space-between">
                        <Box style={applyStyle(addressAmountColumnStyle)}>
                            {txInputs.map(input => (
                                <TransactionAddressAmount
                                    key={input.txid}
                                    address={input.addresses![0]}
                                    amount={formatCryptoInputAmount(input.value)}
                                />
                            ))}
                        </Box>
                        <Icon name="circleRight" color="gray500" size="medium" />
                        <Box style={applyStyle(addressAmountColumnStyle)}>
                            {txOutputs.map(output => (
                                <TransactionAddressAmount
                                    key={output.txid}
                                    address={output.addresses![0]}
                                    amount={formatCryptoInputAmount(output.value)}
                                />
                            ))}
                        </Box>
                    </Box>
                </Card>
            </VStack>
        </TransactionDetailSheet>
    );
};
