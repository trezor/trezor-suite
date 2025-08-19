import { AccountKey } from '@suite-common/wallet-types';
import { Card, useBottomSheetModal } from '@suite-native/atoms';
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

export const TransactionDetailSummary = ({
    transaction,
    accountKey,
    tokenTransfer,
}: TransactionDetailSummaryProps) => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const isTokenTransferDetail = !!tokenTransfer;

    return (
        <Card style={applyStyle(cardStyle)} borderColor="borderElevation1">
            {isTokenTransferDetail ? (
                <TokenTransactionDetailSummary
                    accountKey={accountKey}
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
            <TransactionDetailAddressesSheet
                ref={bottomSheetRef}
                txid={transaction.txid}
                accountKey={accountKey}
                onClose={closeModal}
            />
        </Card>
    );
};
