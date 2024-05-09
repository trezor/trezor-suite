import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Linking } from 'react-native';

import { Box, Button, Divider, VStack } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    StackProps,
} from '@suite-native/navigation';
import {
    BlockchainRootState,
    selectBlockchainExplorerBySymbol,
    selectTransactionByTxidAndAccountKey,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { analytics, EventType } from '@suite-native/analytics';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/ethereum-tokens';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

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
    const { txid, accountKey, tokenTransfer } = route.params;
    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByTxidAndAccountKey(state, txid, accountKey),
    ) as WalletAccountTransaction;
    const blockchainExplorer = useSelector((state: BlockchainRootState) =>
        selectBlockchainExplorerBySymbol(state, transaction?.symbol),
    );

    useEffect(() => {
        if (transaction)
            analytics.report({
                type: EventType.TransactionDetail,
                payload: {
                    assetSymbol: transaction.symbol,
                    tokenSymbol: tokenTransfer?.symbol as TokenSymbol,
                    tokenAddress: tokenTransfer?.contract as TokenAddress,
                },
            });
    }, [transaction, tokenTransfer]);

    if (!transaction) return null;

    const handleOpenBlockchain = () => {
        if (!blockchainExplorer) return;
        analytics.report({ type: EventType.TransactionDetailExploreInBlockchain });
        Linking.openURL(`${blockchainExplorer.tx}${transaction.txid}`);
    };

    const isTokenTransaction = !!tokenTransfer;

    return (
        <Screen customHorizontalPadding={utils.spacings.small} screenHeader={<ScreenSubHeader />}>
            <VStack spacing="large">
                <TransactionDetailHeader
                    transaction={transaction}
                    tokenTransfer={tokenTransfer as EthereumTokenTransfer}
                />
                <TransactionDetailData
                    transaction={transaction}
                    accountKey={accountKey}
                    tokenTransfer={tokenTransfer as EthereumTokenTransfer}
                />
            </VStack>
            <Box marginVertical="large">
                <Divider />
            </Box>
            <TransactionDetailSheets
                transaction={transaction}
                isTokenTransaction={isTokenTransaction}
                accountKey={accountKey}
            />
            <Button
                viewLeft="arrowUpRight"
                onPress={handleOpenBlockchain}
                colorScheme="tertiaryElevation0"
                style={applyStyle(buttonStyle)}
            >
                Explore in blockchain
            </Button>
        </Screen>
    );
};
