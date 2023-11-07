import { TouchableOpacity } from 'react-native-gesture-handler';

import { useNavigation } from '@react-navigation/native';

import { Box, RoundedIcon, Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/ethereum-tokens';
import {
    StackNavigationProps,
    RootStackParamList,
    RootStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TokenTransferListItemValues } from '../TransactionsList/TokenTransferListItem';
import { TransactionListItemValues } from '../TransactionsList/TransactionListItem';
import {
    transactionListItemContainerStyle,
    valuesContainerStyle,
} from '../TransactionsList/TransactionListItemContainer';

type TransactionDetailListItemProps = {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
    tokenTransfer?: EthereumTokenTransfer;
    isFirst?: boolean;
    isLast?: boolean;
    onPress: () => void;
};

type TransactionDetailNavigation = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TransactionDetail
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
        navigation.push(RootStackRoutes.TransactionDetail, {
            txid: transaction.txid,
            accountKey,
            tokenTransfer,
        });
    };

    return (
        <TouchableOpacity
            onPress={handleNavigation}
            style={applyStyle(transactionListItemContainerStyle, { isFirst, isLast })}
        >
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="m">
                    <RoundedIcon name={tokenTransfer?.contract || transaction.symbol} />
                </Box>
                <Box style={applyStyle(CoinNameContainerStyle)}>
                    <Text>{tokenTransfer?.name ?? 'Ethereum'}</Text>
                </Box>
            </Box>
            <Box style={applyStyle(valuesContainerStyle)}>
                {tokenTransfer ? (
                    <TokenTransferListItemValues tokenTransfer={tokenTransfer} />
                ) : (
                    <TransactionListItemValues accountKey={accountKey} transaction={transaction} />
                )}
            </Box>
        </TouchableOpacity>
    );
};
