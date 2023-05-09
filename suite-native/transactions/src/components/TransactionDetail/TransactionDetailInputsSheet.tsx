import React from 'react';

import { NetworkSymbol } from 'suite-common/wallet-config/src';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Box, Card, Text, VStack } from '@suite-native/atoms';
import { AccountAddressFormatter, CryptoAmountFormatter } from '@suite-native/formatters';

import { TransactionDetailSheet } from './TransactionDetailSheet';

type TransactionDetailInputsSheetProps = {
    isVisible: boolean;
    transaction: WalletAccountTransaction;
    onSheetVisibilityChange: () => void;
};

type TransactionAddressAmountProps = {
    address: string;
    amount?: string;
    symbol: NetworkSymbol;
};

const addressAmountColumnStyle = prepareNativeStyle(_ => ({
    maxWidth: '42.5%',
}));

const TransactionAddressAmount = ({
    address,
    amount = '0',
    symbol,
}: TransactionAddressAmountProps) => (
    <Box>
        <AccountAddressFormatter value={address} variant="hint" />
        <CryptoAmountFormatter value={amount} network={symbol} isBalance={false} variant="label" />
    </Box>
);

export const TransactionDetailInputsSheet = ({
    isVisible,
    onSheetVisibilityChange,
    transaction,
}: TransactionDetailInputsSheetProps) => {
    const { applyStyle } = useNativeStyles();

    const txInputs = transaction.details.vin;
    const txOutputs = transaction.details.vout;

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
                    <Text variant="hint" color="textSubdued">
                        Inputs · {txInputs.length}
                    </Text>
                    <Box marginLeft="small">
                        <Icon name="receiveAlt" color="iconSubdued" size="medium" />
                    </Box>
                </Box>

                <Box flex={1} flexDirection="row" alignItems="center" paddingLeft="large">
                    <Text variant="hint" color="textSubdued">
                        Outputs · {txOutputs.length}
                    </Text>
                    <Box marginLeft="small">
                        <Icon name="sendAlt" color="iconSubdued" size="medium" />
                    </Box>
                </Box>
            </Box>
            <VStack>
                <Card>
                    <Box flexDirection="row" justifyContent="space-between">
                        <Box style={applyStyle(addressAmountColumnStyle)}>
                            {txInputs.map(input => (
                                <TransactionAddressAmount
                                    key={input.addresses![0]}
                                    address={input.addresses![0]}
                                    amount={input.value}
                                    symbol={transaction.symbol}
                                />
                            ))}
                        </Box>
                        <Icon name="circleRight" color="iconDisabled" size="medium" />
                        <Box style={applyStyle(addressAmountColumnStyle)}>
                            {txOutputs.map(output => (
                                <TransactionAddressAmount
                                    key={output.addresses![0]}
                                    address={output.addresses![0]}
                                    amount={output.value}
                                    symbol={transaction.symbol}
                                />
                            ))}
                        </Box>
                    </Box>
                </Card>
            </VStack>
        </TransactionDetailSheet>
    );
};
