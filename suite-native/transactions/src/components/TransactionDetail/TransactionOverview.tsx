import { useNavigation } from '@react-navigation/native';

import { AccountKey } from '@suite-common/wallet-types';
import { Box, Card, Divider, HStack, Text, TextButton } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { TypedTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { NetworkTransactionDetailSummary } from './NetworkTransactionDetailSummary';
import { TokenTransactionDetailSummary } from './TokenTransactionDetailSummary';

type TransactionDetailSummaryProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    tokenTransfer?: TypedTokenTransfer;
};

export const cardStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp12,
    ...utils.boxShadows.none,
}));

const cardContentStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
}));

type NavigationProps = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TransactionDetailOverview
>;

export const TransactionOverview = ({
    transaction,
    accountKey,
    tokenTransfer,
}: TransactionDetailSummaryProps) => {
    const { applyStyle } = useNativeStyles();

    const navigation = useNavigation<NavigationProps>();

    const isTokenTransferDetail = !!tokenTransfer;

    const navigateToOverview = () => {
        navigation.navigate(RootStackRoutes.TransactionDetailOverview, {
            txid: transaction.txid,
            accountKey,
        });
    };

    return (
        <Card noPadding={true}>
            <HStack style={applyStyle(cardContentStyle)} flex={1} justifyContent="space-between">
                <Text>
                    <Translation id="transactions.detail.transactionOverviewTitle" />
                </Text>
                <TextButton variant="primary" isUnderlined onPress={navigateToOverview}>
                    <Translation id="transactions.detail.showDetails" />
                </TextButton>
            </HStack>
            <Divider />
            <Box style={applyStyle(cardContentStyle)}>
                {isTokenTransferDetail ? (
                    <TokenTransactionDetailSummary
                        transaction={transaction}
                        tokenTransfer={tokenTransfer}
                        onShowMore={navigateToOverview}
                    />
                ) : (
                    <NetworkTransactionDetailSummary
                        accountKey={accountKey}
                        transaction={transaction}
                        onShowMore={navigateToOverview}
                    />
                )}
            </Box>
        </Card>
    );
};
