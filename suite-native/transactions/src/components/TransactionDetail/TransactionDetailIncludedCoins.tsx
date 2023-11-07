import { useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { BottomSheet, Box, Card, RoundedIcon, Text } from '@suite-native/atoms';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/ethereum-tokens';
import { AccountKey } from '@suite-common/wallet-types';
import { Icon } from '@suite-common/icons';

import { TransactionDetailListItem } from './TransactionDetailListItem';

type TransactionDetailIncludedCoinsProps = {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
    tokenTransfer?: EthereumTokenTransfer;
};

const isSameTokenTransfer = (
    tokenTransferA: EthereumTokenTransfer,
    tokenTransferB: EthereumTokenTransfer,
) =>
    tokenTransferA.from === tokenTransferB.from &&
    tokenTransferA.to === tokenTransferB.to &&
    tokenTransferA.symbol === tokenTransferB.symbol;

const isZeroAmountTransaction = (transaction: WalletAccountTransaction) =>
    transaction.amount.length === 0 || transaction.amount === '0';

const IncludedCoinsSheetTrigger = ({ title, onPress }: { title: string; onPress: () => void }) => (
    <Card>
        <TouchableOpacity onPress={onPress}>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                <Box flexDirection="row" alignItems="center">
                    <Box marginRight="m">
                        <RoundedIcon name="treeStructure" />
                    </Box>
                    <Text>{title}</Text>
                </Box>
                <Icon name="circleRight" color="iconPrimaryDefault" />
            </Box>
        </TouchableOpacity>
    </Card>
);

export const TransactionDetailIncludedCoins = ({
    accountKey,
    transaction,
    tokenTransfer,
}: TransactionDetailIncludedCoinsProps) => {
    const [sheetIsVisible, setSheetIsVisible] = useState(false);

    const isTokenTransactionDetail = !!tokenTransfer;

    const transactionTokensCount = transaction.tokens.length;
    const coinsIncludedCount = isTokenTransactionDetail
        ? transactionTokensCount - 1
        : transactionTokensCount;

    const sheetTitle = `${coinsIncludedCount} coin${coinsIncludedCount > 1 ? 's' : ''} included`;
    const sheetSubtitle = `Transaction #${transaction.txid}`;

    const includedTokens = isTokenTransactionDetail
        ? transaction.tokens.filter(
              transactionToken => !isSameTokenTransfer(transactionToken, tokenTransfer),
          )
        : transaction.tokens;

    const isEthereumCoinDisplayed =
        isTokenTransactionDetail && !isZeroAmountTransaction(transaction);

    const toggleSheet = () => setSheetIsVisible(!sheetIsVisible);

    return (
        <>
            {coinsIncludedCount > 0 && (
                <IncludedCoinsSheetTrigger title={sheetTitle} onPress={toggleSheet} />
            )}

            <BottomSheet
                isVisible={sheetIsVisible}
                title={sheetTitle}
                subtitle={sheetSubtitle}
                onClose={toggleSheet}
            >
                {isEthereumCoinDisplayed && (
                    <TransactionDetailListItem
                        onPress={toggleSheet}
                        accountKey={accountKey}
                        transaction={transaction}
                        isFirst
                    />
                )}
                {includedTokens.map((token, index) => (
                    <TransactionDetailListItem
                        onPress={toggleSheet}
                        key={token.contract}
                        accountKey={accountKey}
                        transaction={transaction}
                        tokenTransfer={token}
                        isFirst={!isEthereumCoinDisplayed && index === 0}
                        isLast={index === includedTokens.length - 1}
                    />
                ))}
            </BottomSheet>
        </>
    );
};
