import { useState } from 'react';

import { Card } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import { EthereumTokenTransfer } from '@suite-native/ethereum-tokens';

import { TransactionDetailAddressesSheet } from './TransactionDetailAddressesSheet';
import { NetworkTransactionDetailSummary } from './NetworkTransactionDetailSummary';
import { TokenTransactionDetailSummary } from './TokenTransactionDetailSummary';

type TransactionDetailSummaryProps = {
    txid: string;
    accountKey: AccountKey;
    tokenTransfer?: EthereumTokenTransfer;
};

export const TransactionDetailSummary = ({
    txid,
    accountKey,
    tokenTransfer,
}: TransactionDetailSummaryProps) => {
    const [isAddressesSheetVisible, setIsAddressesSheetVisible] = useState(false);

    const toggleAddressesSheet = () => setIsAddressesSheetVisible(prev => !prev);

    const isTokenTransferDetail = !!tokenTransfer;

    return (
        <Card>
            {isTokenTransferDetail ? (
                <TokenTransactionDetailSummary
                    accountKey={accountKey}
                    txid={txid}
                    tokenTransfer={tokenTransfer}
                    onShowMore={toggleAddressesSheet}
                />
            ) : (
                <>
                    <NetworkTransactionDetailSummary
                        accountKey={accountKey}
                        txid={txid}
                        onShowMore={toggleAddressesSheet}
                    />
                </>
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
