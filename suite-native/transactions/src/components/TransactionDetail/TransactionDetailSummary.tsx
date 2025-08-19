import { AccountKey } from '@suite-common/wallet-types';
import { Card, useBottomSheetModal } from '@suite-native/atoms';
import { TypedTokenTransfer } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { NetworkTransactionDetailSummary } from './NetworkTransactionDetailSummary';
import { TokenTransactionDetailSummary } from './TokenTransactionDetailSummary';
import { TransactionDetailAddressesSheet } from './TransactionDetailAddressesSheet';

type TransactionDetailSummaryProps = {
    txid: string;
    accountKey: AccountKey;
    tokenTransfer?: TypedTokenTransfer;
};

export const cardStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp12,
    ...utils.boxShadows.none,
}));

export const TransactionDetailSummary = ({
    txid,
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
                    txid={txid}
                    tokenTransfer={tokenTransfer}
                    onShowMore={openModal}
                />
            ) : (
                <NetworkTransactionDetailSummary
                    accountKey={accountKey}
                    txid={txid}
                    onShowMore={openModal}
                />
            )}
            <TransactionDetailAddressesSheet
                ref={bottomSheetRef}
                txid={txid}
                accountKey={accountKey}
                onClose={closeModal}
            />
        </Card>
    );
};
