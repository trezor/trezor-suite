import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    BlockchainRootState,
    TransactionsRootState,
    selectBlockchainExplorerBySymbol,
    selectIsTransactionPending,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { EventType, analytics } from '@suite-native/analytics';
import { Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import { TypedTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';

import { TransactionDetailData } from '../components/TransactionDetail/TransactionDetailData';
import { TransactionDetailHeader } from '../components/TransactionDetail/TransactionDetailHeader';
import { TransactionName } from '../components/TransactionName';

export const TransactionDetailScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.TransactionDetail>) => {
    const { txid, accountKey, tokenContract, closeActionType = 'back' } = route.params;
    const openLink = useOpenLink();
    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, txid),
    ) as WalletAccountTransaction;
    const blockchainExplorer = useSelector((state: BlockchainRootState) =>
        selectBlockchainExplorerBySymbol(state, transaction?.symbol),
    );
    const isPending = useSelector((state: TransactionsRootState) =>
        selectIsTransactionPending(state, txid, accountKey),
    );

    const tokenTransfer = transaction?.tokens.find(token => token.contract === tokenContract);

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
            header={
                <ScreenHeader
                    closeActionType={closeActionType}
                    content={
                        <Text>
                            <Translation
                                id="transactions.detail.header"
                                values={{
                                    transactionType: _ => (
                                        <TransactionName
                                            transaction={transaction}
                                            isPending={isPending}
                                        />
                                    ),
                                }}
                            />
                        </Text>
                    }
                />
            }
        >
            <VStack spacing="sp24">
                <VStack spacing="sp32">
                    <TransactionDetailHeader
                        transaction={transaction}
                        tokenTransfer={tokenTransfer as TypedTokenTransfer}
                        accountKey={accountKey}
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
