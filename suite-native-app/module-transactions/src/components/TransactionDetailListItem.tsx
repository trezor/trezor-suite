import { type AccountKey } from '@suite-common/wallet-types';
import { Blur, Box, PressableOpacity, Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { useNavigateToTransactionDetail } from '@suite-native/navigation';
import {
    TokenName,
    type TypedTokenTransfer,
    type WalletAccountTransaction,
} from '@suite-native/tokens';
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
    onPress?: () => void;
    isPhishingTransaction: boolean;
};

const CoinNameContainerStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

export const TransactionDetailListItem = ({
    accountKey,
    transaction,
    tokenTransfer,
    onPress,
    isPhishingTransaction,
    isFirst = false,
    isLast = false,
}: TransactionDetailListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const navigateToTransactionDetail = useNavigateToTransactionDetail();

    const handleNavigation = () => {
        onPress?.();
        navigateToTransactionDetail({
            txid: transaction.txid,
            accountKey,
            tokenContract: tokenTransfer?.contract,
        });
    };

    return (
        <PressableOpacity
            onPress={handleNavigation}
            style={applyStyle(transactionListItemContainerStyle, { isFirst, isLast })}
        >
            <Blur isBlurred={isPhishingTransaction}>
                <Box flexDirection="row" alignItems="center" flex={1}>
                    <Box marginRight="sp16">
                        <TokenIcon
                            networkSymbol={transaction.symbol}
                            contractAddress={tokenTransfer?.contract}
                            tokenSymbol={tokenTransfer?.symbol || tokenTransfer?.name}
                        />
                    </Box>
                    <Box style={applyStyle(CoinNameContainerStyle)}>
                        {tokenTransfer ? (
                            <TokenName
                                networkSymbol={transaction.symbol}
                                contractAddress={tokenTransfer.contract}
                            />
                        ) : (
                            <Text>Ethereum</Text>
                        )}
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
                        <TransactionListItemValues
                            accountKey={accountKey}
                            transaction={transaction}
                            amount={transaction.amount}
                        />
                    )}
                </Box>
            </Blur>
        </PressableOpacity>
    );
};
