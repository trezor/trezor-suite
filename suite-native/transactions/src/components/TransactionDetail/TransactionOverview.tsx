import { AccountKey } from '@suite-common/wallet-types';
import {
    Box,
    Card,
    Divider,
    HStack,
    Text,
    TextButton,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TypedTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { NetworkTransactionDetailSummary } from './NetworkTransactionDetailSummary';
import { TokenTransactionDetailSummary } from './TokenTransactionDetailSummary';
import { TransactionDetailAddressesSheet } from './TransactionDetailAddressesSheet';

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

export const TransactionOverview = ({
    transaction,
    accountKey,
    tokenTransfer,
}: TransactionDetailSummaryProps) => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const isTokenTransferDetail = !!tokenTransfer;

    return (
        <Card noPadding={true}>
            <HStack style={applyStyle(cardContentStyle)} flex={1} justifyContent="space-between">
                <Text>
                    <Translation id="transactions.detail.transactionOverviewTitle" />
                </Text>
                <TextButton variant="primary" isUnderlined onPress={openModal}>
                    <Translation id="transactions.detail.showDetails" />
                </TextButton>
            </HStack>
            <Divider />
            <Box style={applyStyle(cardContentStyle)}>
                {isTokenTransferDetail ? (
                    <TokenTransactionDetailSummary
                        transaction={transaction}
                        tokenTransfer={tokenTransfer}
                        onShowMore={openModal}
                    />
                ) : (
                    <NetworkTransactionDetailSummary
                        accountKey={accountKey}
                        transaction={transaction}
                        onShowMore={openModal}
                    />
                )}
            </Box>
            <TransactionDetailAddressesSheet
                ref={bottomSheetRef}
                txid={transaction.txid}
                accountKey={accountKey}
                onClose={closeModal}
            />
        </Card>
    );
};
