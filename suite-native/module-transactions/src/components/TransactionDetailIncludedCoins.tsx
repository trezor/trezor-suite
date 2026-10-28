import { useSelector } from 'react-redux';

import { type AccountsRootState, selectIsAccountUtxoBased } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    Box,
    Card,
    IconCircle,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { TransactionIdFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import { useNativeStyles } from '@trezor/styles-native';

import { TransactionDetailListItem } from './TransactionDetailListItem';
import { cardStyle } from './TransactionOverview';

type TransactionDetailIncludedCoinsProps = {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
    tokenTransfer?: TypedTokenTransfer;
    isPhishingTransaction: boolean;
};

const isSameTokenTransfer = (
    tokenTransferA: TypedTokenTransfer,
    tokenTransferB: TypedTokenTransfer,
) =>
    tokenTransferA.from === tokenTransferB.from &&
    tokenTransferA.to === tokenTransferB.to &&
    tokenTransferA.symbol === tokenTransferB.symbol;

const isZeroAmountTransaction = (transaction: WalletAccountTransaction) =>
    transaction.amount.length === 0 || transaction.amount === '0';

const IncludedCoinsSheetTrigger = ({ title, onPress }: { title: string; onPress: () => void }) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card borderColor="borderNeutral" style={applyStyle(cardStyle)}>
            <PressableOpacity onPress={onPress}>
                <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                    <Box flexDirection="row" alignItems="center">
                        <Box marginRight="sp16">
                            <IconCircle name="treeStructure" />
                        </Box>
                        <Text>{title}</Text>
                    </Box>
                    <Icon name="caretCircleRight" color="contentBrand" />
                </Box>
            </PressableOpacity>
        </Card>
    );
};

export const TransactionDetailIncludedCoins = ({
    accountKey,
    transaction,
    tokenTransfer,
    isPhishingTransaction,
}: TransactionDetailIncludedCoinsProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, accountKey),
    );
    const { translate } = useTranslate();

    const isTokenTransactionDetail = !!tokenTransfer;

    const transactionTokensCount = transaction.tokens.length;
    const coinsIncludedCount = isTokenTransactionDetail
        ? transactionTokensCount - 1
        : transactionTokensCount;

    const sheetTitle = translate(
        isAccountUtxoBased
            ? 'transactions.detail.coinsIncluded'
            : 'transactions.detail.tokensIncluded',
        { count: coinsIncludedCount },
    );

    const includedTokens = isTokenTransactionDetail
        ? transaction.tokens.filter(
              transactionToken => !isSameTokenTransfer(transactionToken, tokenTransfer),
          )
        : transaction.tokens;

    const isEthereumCoinDisplayed =
        isTokenTransactionDetail && !isZeroAmountTransaction(transaction);

    return (
        <>
            {coinsIncludedCount > 0 && (
                <IncludedCoinsSheetTrigger title={sheetTitle} onPress={openModal} />
            )}

            <BottomSheetModal
                ref={bottomSheetRef}
                title={sheetTitle}
                subtitle={
                    <VStack spacing="sp1">
                        <Text>
                            <Translation id="transactions.detail.transaction" />
                        </Text>
                        <TransactionIdFormatter value={transaction.txid} color="contentPrimary" />
                    </VStack>
                }
                isCloseDisplayed
            >
                {isEthereumCoinDisplayed && (
                    <TransactionDetailListItem
                        onPress={closeModal}
                        accountKey={accountKey}
                        transaction={transaction}
                        isPhishingTransaction={isPhishingTransaction}
                        isFirst
                    />
                )}

                {includedTokens.map((token, index) => (
                    <TransactionDetailListItem
                        onPress={closeModal}
                        key={token.contract}
                        accountKey={accountKey}
                        transaction={transaction}
                        tokenTransfer={token}
                        isPhishingTransaction={isPhishingTransaction}
                        isFirst={!isEthereumCoinDisplayed && index === 0}
                        isLast={index === includedTokens.length - 1}
                    />
                ))}
            </BottomSheetModal>
        </>
    );
};
