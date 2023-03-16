import React from 'react';
import { useSelector } from 'react-redux';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Box, Card, IconButton, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { getConfirmations, getFeeRate, getFeeUnits } from '@suite-common/wallet-utils';
import { BlockchainRootState, selectBlockchainHeightBySymbol } from '@suite-common/wallet-core';
import { useCopyToClipboard } from '@suite-native/helpers';
import { TransactionIdFormatter } from '@suite-native/formatters';

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
    const copyToClipboard = useCopyToClipboard();
    const { applyStyle } = useNativeStyles();
    const blockchainHeight = useSelector((state: BlockchainRootState) =>
        selectBlockchainHeightBySymbol(state, transaction.symbol),
    );

    const handleClickCopy = () => copyToClipboard(transaction.txid, 'Transaction ID copied');

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
                            <TransactionIdFormatter value={transaction.txid} />
                            <Box marginLeft="medium">
                                <IconButton
                                    iconName="copy"
                                    onPress={handleClickCopy}
                                    colorScheme="tertiaryElevation1"
                                    size="medium"
                                />
                            </Box>
                        </Box>
                    </TransactionDetailRow>
                    <TransactionDetailRow title="Confirmations">
                        <Text>{confirmationsCount} </Text>
                        <Box marginLeft="small">
                            <Icon name="confirmation" />
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

                    {transaction.symbol === 'btc' && (
                        // Note: Ethereum and tokens will have different fee rate units.
                        // https://github.com/trezor/trezor-suite/issues/7729
                        <TransactionDetailRow title="Fee rate">
                            {`${getFeeRate(transaction)} ${getFeeUnits('bitcoin')}`}
                        </TransactionDetailRow>
                    )}
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
