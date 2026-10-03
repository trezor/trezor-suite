import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation, usePreventRemove } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import {
    type AccountsRootState,
    createTargets,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { Button, HStack, VStack } from '@suite-native/atoms';
import { useInAppRating } from '@suite-native/in-app-rating';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type StackProps,
    type TransactionDetailStackParamList,
    type TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { useTransactionDetails } from '@suite-native/transaction-management';
import {
    InstantStakeBanner,
    getUnstakeTxAmount,
    useFetchMissingTransactionFiatRates,
} from '@suite-native/transactions';

import { CancelEvmTransactionButton } from '../components/CancelEvmTransactionButton';
import { TransactionDetailData } from '../components/TransactionDetailData';
import { TransactionDetailError } from '../components/TransactionDetailError';
import { TransactionDetailHeader } from '../components/TransactionDetailHeader';
import { TransactionDetailSkeleton } from '../components/TransactionDetailSkeleton';
import { TransactionDetailTitle } from '../components/TransactionDetailTitle';
import { useFetchTransactionById } from '../hooks/useFetchTransactionById';

export const TransactionDetailScreen = ({
    route,
}: StackProps<TransactionDetailStackParamList, TransactionDetailStackRoutes.TransactionDetail>) => {
    const { askForRating } = useInAppRating();
    const navigation = useNavigation();
    const { analytics } = useServices(injectNativeAnalytics);
    const { txid, accountKey, tokenContract, closeActionType = 'back', source } = route.params;

    const { transaction, isPending, tokenTransfer, openInBlockchain } = useTransactionDetails({
        accountKey,
        txid,
        tokenContract,
    });

    usePreventRemove(source === 'send', ({ data }) => {
        navigation.dispatch(data.action);
        askForRating();
    });

    useFetchMissingTransactionFiatRates({ accountKey, isEnabled: !!transaction });
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const transactionFetch = useFetchTransactionById({
        accountKey,
        txid,
        isEnabled: !transaction,
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

    const isUnstakeTransaction = transaction
        ? getUnstakeTxAmount(transaction) !== undefined
        : false;

    const handleOpenBlockchain = () => {
        analytics.report({
            type: events.transactionDetailExploreInBlockchainEvent.name,
        });
        openInBlockchain();
    };

    const allOutputs =
        transaction && account !== null ? createTargets({ transaction, account }) : [];

    const headerContent = transaction ? (
        <HStack spacing="sp8" alignItems="center" justifyContent="center">
            <TransactionDetailTitle
                transaction={transaction}
                isPending={isPending}
                tokenTransfer={tokenTransfer}
            />
        </HStack>
    ) : undefined;
    const unavailableContent =
        transactionFetch.isError && !transactionFetch.isFetching ? (
            <TransactionDetailError onRetry={transactionFetch.retry} />
        ) : (
            <TransactionDetailSkeleton />
        );

    return (
        <Screen
            header={
                <ScreenHeader closeActionType={closeActionType} customContent={headerContent} />
            }
        >
            {transaction ? (
                <VStack spacing="sp24">
                    <VStack spacing="sp24">
                        <TransactionDetailHeader
                            transaction={transaction}
                            tokenTransfer={tokenTransfer}
                            allOutputs={allOutputs}
                        />
                        {isUnstakeTransaction && (
                            <InstantStakeBanner accountKey={accountKey} transaction={transaction} />
                        )}
                        <TransactionDetailData
                            transaction={transaction}
                            accountKey={accountKey}
                            tokenTransfer={tokenTransfer}
                        />
                    </VStack>
                    <CancelEvmTransactionButton accountKey={accountKey} transaction={transaction} />
                    <Button
                        iconRight="arrowUpRight"
                        onPress={handleOpenBlockchain}
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="transactions.detail.exploreButton" />
                    </Button>
                </VStack>
            ) : (
                unavailableContent
            )}
        </Screen>
    );
};
