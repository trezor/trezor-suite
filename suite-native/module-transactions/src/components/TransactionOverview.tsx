import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, Divider, HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle } from '@trezor/styles';

import { NetworkTransactionDetailSummary } from './NetworkTransactionDetailSummary';
import { TokenTransactionDetailSummary } from './TokenTransactionDetailSummary';
import { TransactionDetailStellarTrustlineSummary } from './TransactionDetailStellarTrustlineSummary';

type TransactionDetailSummaryProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    tokenTransfer?: TypedTokenTransfer;
    onShowMore: () => void;
};

export const cardStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp12,
    ...utils.boxShadows.none,
}));

export const TransactionOverview = ({
    transaction,
    accountKey,
    tokenTransfer,
    onShowMore,
}: TransactionDetailSummaryProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isTokenTransferDetail = !!tokenTransfer;

    if (!account) return null;

    // Check if this is a Stellar trustline transaction
    const isStellarTrustline =
        transaction.stellarSpecific?.operationType === 'changeTrust' &&
        transaction.stellarSpecific?.changeTrust;

    const renderContent = () => {
        if (isStellarTrustline) {
            return <TransactionDetailStellarTrustlineSummary transaction={transaction} />;
        }

        if (isTokenTransferDetail) {
            return (
                <TokenTransactionDetailSummary
                    transaction={transaction}
                    tokenTransfer={tokenTransfer}
                    onShowMore={onShowMore}
                />
            );
        }

        return (
            <NetworkTransactionDetailSummary
                accountKey={accountKey}
                transaction={transaction}
                onShowMore={onShowMore}
            />
        );
    };

    return (
        <Card noPadding={true}>
            <HStack padding="sp16" alignItems="center" flex={1} justifyContent="space-between">
                <Text variant="body-sm">
                    <Translation id="transactions.detail.transactionOverviewTitle" />
                </Text>
            </HStack>
            <Divider />
            <Box padding="sp16">{renderContent()}</Box>
        </Card>
    );
};
