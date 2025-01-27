import { useState } from 'react';

import { AccountKey } from '@suite-common/wallet-types';
import { Card } from '@suite-native/atoms';
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
    const [isAddressesSheetVisible, setIsAddressesSheetVisible] = useState(false);

    const toggleAddressesSheet = () => setIsAddressesSheetVisible(prev => !prev);

    const isTokenTransferDetail = !!tokenTransfer;

    return (
        <Card style={applyStyle(cardStyle)} borderColor="borderElevation1">
            {isTokenTransferDetail ? (
                <TokenTransactionDetailSummary
                    accountKey={accountKey}
                    txid={txid}
                    tokenTransfer={tokenTransfer}
                    onShowMore={toggleAddressesSheet}
                />
            ) : (
                <NetworkTransactionDetailSummary
                    accountKey={accountKey}
                    txid={txid}
                    onShowMore={toggleAddressesSheet}
                />
            )}
            <TransactionDetailAddressesSheet
                isVisible={isAddressesSheetVisible}
                txid={txid}
                accountKey={accountKey}
                onClose={toggleAddressesSheet}
            />
        </Card>
    );
};
