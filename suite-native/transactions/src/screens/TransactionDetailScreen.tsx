import React from 'react';
import { useSelector } from 'react-redux';
import { Linking } from 'react-native';

import { Box, Button, Text, VStack } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import {
    BlockchainRootState,
    selectBlockchainExplorerBySymbol,
    selectTransactionByTxid,
} from '@suite-common/wallet-core';
import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { useFormatters } from '@suite-common/formatters';
import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TransactionDetailHeader } from '../components/TransactionDetail/TransactionDetailHeader';
import { TransactionDetailData } from '../components/TransactionDetail/TransactionDetailData';
import { TransactionDetailSheets } from '../components/TransactionDetail/TransactionDetailSheets';

const buttonStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.large,
}));

export const TransactionDetailScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.TransactionDetail>) => {
    const { applyStyle, utils } = useNativeStyles();
    const { txid } = route.params;
    const transaction = useSelector((state: any) => selectTransactionByTxid(txid, state));
    const blockchainExplorer = useSelector((state: BlockchainRootState) =>
        selectBlockchainExplorerBySymbol(state, transaction?.symbol),
    );
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { CryptoAmountFormatter } = useFormatters();

    if (!transaction) return null;

    const transactionAmount = formatNetworkAmount(transaction.amount, transaction.symbol);
    const fiatAmount = toFiatCurrency(transactionAmount, fiatCurrency.label, transaction.rates);
    const cryptoAmountFormatted = CryptoAmountFormatter.format(transactionAmount, {
        symbol: transaction.symbol,
    });

    const handleOpenBlockchain = () => {
        if (!blockchainExplorer) return;
        Linking.openURL(`${blockchainExplorer.tx}${transaction.txid}`);
    };

    return (
        <Screen customHorizontalPadding={utils.spacings.small} header={<ScreenHeader />}>
            <VStack spacing="large">
                <TransactionDetailHeader
                    type={transaction.type}
                    amount={cryptoAmountFormatted}
                    fiatAmount={fiatAmount}
                />
                <TransactionDetailData transaction={transaction} />
            </VStack>
            <TransactionDetailSheets transaction={transaction} fiatCurrency={fiatCurrency} />
            <Button
                onPress={handleOpenBlockchain}
                colorScheme="gray"
                style={applyStyle(buttonStyle)}
            >
                <Box flexDirection="row">
                    <Text>Explore in blockchain</Text>
                    <Icon size="mediumLarge" name="arrowUpRight" color="gray1000" />
                </Box>
            </Button>
        </Screen>
    );
};
