import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    BlockchainRootState,
    selectBlockchainExplorerBySymbol,
    selectTransactionByTxidAndAccountKey,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { analytics, EventType } from '@suite-native/analytics';
import { Box, Button, Button, Text, Divider, VStack } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    StackProps,
} from '@suite-native/navigation';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    BlockchainRootState,
    selectBlockchainExplorerBySymbol,
    selectTransactionByTxidAndAccountKey,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { useNativeStyles } from '@trezor/styles';
import { analytics, EventType } from '@suite-native/analytics';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';
import { TokenAddress, TokenSymbol, TransactionType } from '@suite-common/wallet-types';
import { useOpenLink } from '@suite-native/link';
import { Translation } from '@suite-native/intl';

import { TransactionDetailData } from '../components/TransactionDetail/TransactionDetailData';
import { TransactionDetailHeader } from '../components/TransactionDetail/TransactionDetailHeader';
import { TransactionDetailSheets } from '../components/TransactionDetail/TransactionDetailSheets';

const typeHeaderMap = {
    recv: 'Received',
    sent: 'Sent',
    contract: 'Contract',
    self: 'Self',
    joint: 'Joint',
    failed: 'Failed',
    unknown: 'Unknown',
} as const satisfies Record<TransactionType, string>;

export const TransactionDetailScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.TransactionDetail>) => {
    const { utils } = useNativeStyles();
    const { txid, accountKey, tokenTransfer } = route.params;
    const openLink = useOpenLink();
    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByTxidAndAccountKey(state, txid, accountKey),
    ) as WalletAccountTransaction;
    const blockchainExplorer = useSelector((state: BlockchainRootState) =>
        selectBlockchainExplorerBySymbol(state, transaction?.symbol),
    );

    useEffect(() => {
        if (transaction) {
            analytics.report({
                type: EventType.TransactionDetail,
                payload: {
                    assetSymbol: transaction.symbol,
                    tokenSymbol: tokenTransfer?.symbol as TokenSymbol,
                    tokenAddress: tokenTransfer?.contract as TokenAddress,
                },
            });
        }
    }, [transaction, tokenTransfer]);

    if (!transaction) return null;

    const handleOpenBlockchain = () => {
        if (!blockchainExplorer) return;
        analytics.report({ type: EventType.TransactionDetailExploreInBlockchain });
        openLink(`${blockchainExplorer.tx}${transaction.txid}`);
    };

    return (
        <Screen
            customHorizontalPadding={utils.spacings.medium}
            screenHeader={
                <ScreenSubHeader
                    content={
                        <Text>
                            <Translation
                                id="transactions.detail.header"
                                values={{
                                    transactionType: _ => typeHeaderMap[transaction.type],
                                }}
                            />
                        </Text>
                    }
                />
            }
        >
            <VStack spacing="large">
                <VStack spacing="extraLarge">
                    <TransactionDetailHeader
                        transaction={transaction}
                        tokenTransfer={tokenTransfer as EthereumTokenTransfer}
                        accountKey={accountKey}
                    />
                    <TransactionDetailData
                        transaction={transaction}
                        accountKey={accountKey}
                        tokenTransfer={tokenTransfer as EthereumTokenTransfer}
                    />
                </VStack>
                <Button
                    size="large"
                    viewLeft="arrowUpRight"
                    onPress={handleOpenBlockchain}
                    colorScheme="tertiaryElevation0"
                >
                    <Translation id="transactions.detail.exploreButton" />
                </Button>
            </VStack>
        </Screen>
    );
};
