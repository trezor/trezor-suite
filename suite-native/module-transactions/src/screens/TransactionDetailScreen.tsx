import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation, usePreventRemove } from '@react-navigation/native';

import { getExplorerUrl } from '@suite-common/wallet-config';
import {
    ExplorerState,
    TransactionsRootState,
    selectExplorer,
    selectIsTransactionPending,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { EventType } from '@suite-native/analytics';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { useInAppRating } from '@suite-native/in-app-rating';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    Screen,
    ScreenHeader,
    StackProps,
    TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { TypedTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';
import { TransactionName } from '@suite-native/transactions';

import { TransactionDetailData } from '../components/TransactionDetailData';
import { TransactionDetailHeader } from '../components/TransactionDetailHeader';

export const TransactionDetailScreen = ({
    route,
}: StackProps<TransactionDetailStackParamList, TransactionDetailStackRoutes.TransactionDetail>) => {
    const { askForRating } = useInAppRating();
    const navigation = useNavigation();
    const analytics = useAnalytics();
    const { txid, accountKey, tokenContract, closeActionType = 'back', source } = route.params;
    const openLink = useOpenLink();
    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, txid),
    ) as WalletAccountTransaction;
    const blockchainExplorer = useSelector((state: ExplorerState) =>
        selectExplorer(state, transaction?.symbol),
    );
    const isPending = useSelector((state: TransactionsRootState) =>
        selectIsTransactionPending(state, txid, accountKey),
    );

    const tokenTransfer = transaction?.tokens.find(token => token.contract === tokenContract);

    usePreventRemove(source === 'send', ({ data }) => {
        navigation.dispatch(data.action);
        askForRating();
    });

    useEffect(() => {
        if (transaction) {
            analytics.report({
                type: EventType.TransactionDetail,
                payload: {
                    assetSymbol: transaction.symbol,
                    tokenSymbol: tokenTransfer?.symbol,
                    tokenAddress: tokenTransfer?.contract,
                },
            });
        }
    }, [transaction, tokenTransfer, analytics]);

    if (!transaction) return null;

    const handleOpenBlockchain = () => {
        if (!blockchainExplorer) return;
        analytics.report({
            type: EventType.TransactionDetailExploreInBlockchain,
        });
        const explorerUrl = getExplorerUrl(blockchainExplorer, 'tx');
        openLink(`${explorerUrl}${transaction.txid}`);
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType={closeActionType}
                    customContent={
                        <HStack spacing="sp8" alignItems="center" justifyContent="center">
                            <CryptoIconWithNetwork
                                symbol={transaction.symbol}
                                contractAddress={tokenTransfer?.contract}
                            />
                            <Text variant="highlight">
                                <Translation
                                    id="transactions.detail.header"
                                    values={{
                                        transactionType: _ => (
                                            <TransactionName
                                                key={transaction.txid}
                                                transaction={transaction}
                                                isPending={isPending}
                                                variant="highlight"
                                            />
                                        ),
                                    }}
                                />
                            </Text>
                        </HStack>
                    }
                />
            }
        >
            <VStack spacing="sp24">
                <VStack spacing="sp32">
                    <TransactionDetailHeader
                        transaction={transaction}
                        tokenTransfer={tokenTransfer as TypedTokenTransfer}
                    />
                    <TransactionDetailData
                        transaction={transaction}
                        accountKey={accountKey}
                        tokenTransfer={tokenTransfer as TypedTokenTransfer}
                    />
                </VStack>
                <Button
                    size="large"
                    viewRight="arrowUpRight"
                    onPress={handleOpenBlockchain}
                    colorScheme="tertiaryElevation0"
                >
                    <Translation id="transactions.detail.exploreButton" />
                </Button>
            </VStack>
        </Screen>
    );
};
