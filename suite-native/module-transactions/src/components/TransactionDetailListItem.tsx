import { useNavigation } from '@react-navigation/native';

import { type AccountKey } from '@suite-common/wallet-types';
import { Box, PressableOpacity, RoundedIcon, Text } from '@suite-native/atoms';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import {
    TokenTransferListItemValues,
    TransactionListItemValues,
    transactionListItemContainerStyle,
    valuesContainerStyle,
} from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TransactionDetailListItemProps = {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
    tokenTransfer?: TypedTokenTransfer;
    isFirst?: boolean;
    isLast?: boolean;
    onPress: () => void;
};

type TransactionDetailNavigation = StackToStackCompositeNavigationProps<
    RootStackParamList,
    TransactionDetailStackRoutes.TransactionDetail,
    TransactionDetailStackParamList
>;

const CoinNameContainerStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

export const TransactionDetailListItem = ({
    accountKey,
    transaction,
    tokenTransfer,
    onPress,
    isFirst = false,
    isLast = false,
}: TransactionDetailListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<TransactionDetailNavigation>();

    const handleNavigation = () => {
        onPress();
        navigation.navigate(RootStackRoutes.TransactionDetailStack, {
            screen: TransactionDetailStackRoutes.TransactionDetail,
            params: {
                txid: transaction.txid,
                accountKey,
                tokenContract: tokenTransfer?.contract,
            },
        });
    };

    return (
        <PressableOpacity
            onPress={handleNavigation}
            style={applyStyle(transactionListItemContainerStyle, { isFirst, isLast })}
        >
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="sp16">
                    <RoundedIcon
                        symbol={transaction.symbol}
                        contractAddress={tokenTransfer?.contract}
                    />
                </Box>
                <Box style={applyStyle(CoinNameContainerStyle)}>
                    <Text>{tokenTransfer?.name ?? 'Ethereum'}</Text>
                </Box>
            </Box>
            <Box style={applyStyle(valuesContainerStyle)}>
                {tokenTransfer ? (
                    <TokenTransferListItemValues
                        accountKey={accountKey}
                        tokenTransfer={tokenTransfer}
                        transaction={transaction}
                    />
                ) : (
                    <TransactionListItemValues accountKey={accountKey} transaction={transaction} />
                )}
            </Box>
        </PressableOpacity>
    );
};
