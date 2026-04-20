import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation, usePreventRemove } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { getExplorerUrl } from '@suite-common/wallet-config';
import {
    type ExplorerState,
    type TransactionsRootState,
    selectExplorer,
    selectIsTransactionPending,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { redactNumericalSubstring } from '@suite-common/wallet-utils';
import { events } from '@suite-native/analytics';
import { Button, HStack, Text, VStack, useDiscreetMode } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { useInAppRating } from '@suite-native/in-app-rating';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    Screen,
    ScreenHeader,
    type StackProps,
    type TransactionDetailStackParamList,
    type TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import {
    InstantStakeBanner,
    TransactionName,
    getUnstakeTxAmount,
} from '@suite-native/transactions';

import { TransactionDetailData } from '../components/TransactionDetailData';
import { TransactionDetailHeader } from '../components/TransactionDetailHeader';

export const TransactionDetailScreen = ({
    route,
}: StackProps<TransactionDetailStackParamList, TransactionDetailStackRoutes.TransactionDetail>) => {
    const { askForRating } = useInAppRating();
    const navigation = useNavigation();
    const analytics = useAnalytics();
    const { CryptoAmountFormatter: cryptoAmountFormatter } = useFormatters();
    const { isDiscreetMode } = useDiscreetMode();
    const { txid, accountKey, tokenContract, closeActionType = 'back', source } = route.params;
    const openLink = useOpenLink();
    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, txid),
    ) as WalletAccountTransaction;
    const blockchainExplorer = useSelector((state: ExplorerState) =>
        selectExplorer(state, transaction?.symbol),
    );
    const isPending = useSelector((state: TransactionsRootState) =>
        selectIsTransactionPending(state, accountKey, txid),
    );

    const tokenTransfer = transaction?.tokens.find(token => token.contract === tokenContract);

    usePreventRemove(source === 'send', ({ data }) => {
        navigation.dispatch(data.action);
        askForRating();
    });

    useEffect(() => {
        if (transaction) {
            analytics.report({
                type: events.transactionDetailEvent.name,
                payload: {
                    assetSymbol: transaction.symbol,
                    tokenSymbol: tokenTransfer?.symbol,
                    tokenAddress: tokenTransfer?.contract,
                },
            });
        }
    }, [transaction, tokenTransfer, analytics]);

    if (!transaction) return null;

    const unstakeAmount = getUnstakeTxAmount(transaction);
    const isUnstakeTransaction = unstakeAmount !== undefined;
    const formattedUnstakeAmount = isUnstakeTransaction
        ? cryptoAmountFormatter.format(unstakeAmount, {
              symbol: transaction.symbol,
              isBalance: false,
              isEllipsisAppended: false,
          })
        : '';
    const displayedUnstakeAmount = isDiscreetMode
        ? redactNumericalSubstring(formattedUnstakeAmount)
        : formattedUnstakeAmount;

    const handleOpenBlockchain = () => {
        if (!blockchainExplorer) return;
        analytics.report({
            type: events.transactionDetailExploreInBlockchainEvent.name,
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
                            {!isUnstakeTransaction && (
                                <CryptoIconWithNetwork
                                    symbol={transaction.symbol}
                                    contractAddress={tokenTransfer?.contract}
                                />
                            )}
                            <Text variant="body-md-strong">
                                {isUnstakeTransaction ? (
                                    <Translation
                                        id="transactions.detail.unstakeHeader"
                                        values={{ amount: displayedUnstakeAmount }}
                                    />
                                ) : (
                                    <Translation
                                        id="transactions.detail.header"
                                        values={{
                                            transactionType: () => (
                                                <TransactionName
                                                    key={transaction.txid}
                                                    transaction={transaction}
                                                    isPending={isPending}
                                                    variant="body-md-strong"
                                                />
                                            ),
                                        }}
                                    />
                                )}
                            </Text>
                        </HStack>
                    }
                />
            }
        >
            <VStack spacing="sp24">
                <VStack spacing="sp24">
                    <TransactionDetailHeader
                        transaction={transaction}
                        tokenTransfer={tokenTransfer as TypedTokenTransfer}
                    />
                    {isUnstakeTransaction && (
                        <InstantStakeBanner accountKey={accountKey} transaction={transaction} />
                    )}
                    <TransactionDetailData
                        transaction={transaction}
                        accountKey={accountKey}
                        tokenTransfer={tokenTransfer as TypedTokenTransfer}
                    />
                </VStack>
                <Button
                    iconRight="arrowUpRight"
                    onPress={handleOpenBlockchain}
                    intent="neutral"
                    priority="secondary"
                >
                    <Translation id="transactions.detail.exploreButton" />
                </Button>
            </VStack>
        </Screen>
    );
};
