import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { Box, Card, Divider, HStack, Text, TextButton } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    StackNavigationProps,
    TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { TypedTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle } from '@trezor/styles';

import { NetworkTransactionDetailSummary } from './NetworkTransactionDetailSummary';
import { TokenTransactionDetailSummary } from './TokenTransactionDetailSummary';
import { TransactionDetailStellarTrustlineSummary } from './TransactionDetailStellarTrustlineSummary';

type TransactionDetailSummaryProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    tokenTransfer?: TypedTokenTransfer;
};

export const cardStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp12,
    ...utils.boxShadows.none,
}));

type NavigationProps = StackNavigationProps<
    TransactionDetailStackParamList,
    TransactionDetailStackRoutes.TransactionDetailOverview
>;

export const TransactionOverview = ({
    transaction,
    accountKey,
    tokenTransfer,
}: TransactionDetailSummaryProps) => {
    const navigation = useNavigation<NavigationProps>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isTokenTransferDetail = !!tokenTransfer;

    const navigateToOverview = () => {
        navigation.navigate(TransactionDetailStackRoutes.TransactionDetailOverview, {
            txid: transaction.txid,
            accountKey,
        });
    };

    if (!account) return null;

    const isUtxoBasedNetwork = isUtxoBased(account);

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
                    onShowMore={navigateToOverview}
                />
            );
        }

        return (
            <NetworkTransactionDetailSummary
                accountKey={accountKey}
                transaction={transaction}
                onShowMore={navigateToOverview}
            />
        );
    };

    return (
        <Card noPadding={true}>
            <HStack padding="sp16" alignItems="center" flex={1} justifyContent="space-between">
                <Text variant="hint">
                    <Translation id="transactions.detail.transactionOverviewTitle" />
                </Text>
                {isUtxoBasedNetwork && (
                    <TextButton
                        size="small"
                        variant="primary"
                        isUnderlined
                        onPress={navigateToOverview}
                    >
                        <Translation id="transactions.detail.showDetails" />
                    </TextButton>
                )}
            </HStack>
            <Divider />
            <Box padding="sp16">{renderContent()}</Box>
        </Card>
    );
};
