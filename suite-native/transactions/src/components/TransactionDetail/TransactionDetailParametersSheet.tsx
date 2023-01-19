import React from 'react';
import { useSelector } from 'react-redux';

import * as Clipboard from 'expo-clipboard';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Box, Card, IconButton, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { getConfirmations, getFeeRate, getFeeUnits } from '@suite-common/wallet-utils';
import { BlockchainRootState, selectBlockchainHeight } from '@suite-common/wallet-core';

import { TransactionDetailSheet } from './TransactionDetailSheet';
import { TransactionDetailRow } from './TransactionDetailRow';

type TransactionDetailParametersSheetProps = {
    isVisible: boolean;
    transaction: WalletAccountTransaction;
    onSheetVisibilityChange: () => void;
};

const transactionIdStyle = prepareNativeStyle(_ => ({
    maxWidth: '72%',
}));

export const TransactionDetailParametersSheet = ({
    isVisible,
    onSheetVisibilityChange,
    transaction,
}: TransactionDetailParametersSheetProps) => {
    const { applyStyle } = useNativeStyles();
    const blockchainHeight = useSelector((state: BlockchainRootState) =>
        selectBlockchainHeight(state, transaction.symbol),
    );

    const handleClickCopy = () => Clipboard.setStringAsync(transaction.txid);

    const confirmationsCount = getConfirmations(transaction, blockchainHeight);

    return (
        <TransactionDetailSheet
            isVisible={isVisible}
            onVisibilityChange={onSheetVisibilityChange}
            title="Parameters"
            iconName="warningCircle"
            transactionId={transaction.txid}
        >
            <VStack marginBottom="medium">
                <Card>
                    <TransactionDetailRow title="Transaction ID">
                        <Box
                            flexDirection="row"
                            alignItems="center"
                            paddingLeft="medium"
                            style={applyStyle(transactionIdStyle)}
                        >
                            <Text
                                variant="hint"
                                color="gray1000"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                #{transaction.txid}
                            </Text>
                            <Box marginLeft="medium">
                                <IconButton
                                    iconName="copy"
                                    onPress={handleClickCopy}
                                    isRounded
                                    colorScheme="gray"
                                    size="large"
                                />
                            </Box>
                        </Box>
                    </TransactionDetailRow>
                    <TransactionDetailRow title="Confirmations">
                        <Text color="gray1000">{confirmationsCount} </Text>
                        <Box marginLeft="small">
                            <Icon name="confirmation" color="gray1000" />
                        </Box>
                    </TransactionDetailRow>
                </Card>

                <Card>
                    {/* TODO: Uncoment when ethereum design is ready. */}
                    {/* {transaction.symbol === 'eth' && (
                    <>
                        <TransactionDetailRow
                            title="Gas limit"
                            text={transaction.ethereumSpecific!.gasLimit}
                        />
                        <TransactionDetailRow
                            title="Gas fee"
                            text={transaction.ethereumSpecific!.gasUsed}
                        />
                        <TransactionDetailRow
                            title="Nonce"
                            text={transaction.ethereumSpecific!.nonce}
                        />
                    </>
                )} */}

                    <TransactionDetailRow title="Fee rate">
                        {`${getFeeRate(transaction)} ${getFeeUnits('bitcoin')}`}
                    </TransactionDetailRow>
                    <TransactionDetailRow title="Broadcast">
                        {transaction.blockHeight ? 'Enabled' : 'Disabled'}
                    </TransactionDetailRow>
                    <TransactionDetailRow title="RBF">
                        {transaction.rbf ? 'Enabled' : 'Disabled'}
                    </TransactionDetailRow>
                    <TransactionDetailRow title="Locktime">
                        {transaction.lockTime ? 'Enabled' : 'Disabled'}
                    </TransactionDetailRow>
                </Card>
            </VStack>
        </TransactionDetailSheet>
    );
};
