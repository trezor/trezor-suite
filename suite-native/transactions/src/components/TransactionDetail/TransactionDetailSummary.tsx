import { useState } from 'react';

import { AccountKey } from '@suite-common/wallet-types';
import { Card, useBottomSheetModal } from '@suite-native/atoms';
import { TypedTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { NetworkTransactionDetailSummary } from './NetworkTransactionDetailSummary';
import { TokenTransactionDetailSummary } from './TokenTransactionDetailSummary';
import { TransactionDetailAddressesSheet } from './TransactionDetailAddressesSheet';
import { AddressesType } from '../../types';

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
    const [displayedAddressesType, setDisplayedAddressesType] = useState<AddressesType>('inputs');

    const isTokenTransferDetail = !!tokenTransfer;

    const handleOpenModal = (addressesType: AddressesType) => {
        setDisplayedAddressesType(addressesType);
        openModal();
    };

    const toggleAddresses = () => {
        setDisplayedAddressesType(displayedAddressesType === 'inputs' ? 'outputs' : 'inputs');
    };

    return (
        <Card style={applyStyle(cardStyle)} borderColor="borderElevation1">
            {isTokenTransferDetail ? (
                <TokenTransactionDetailSummary
                    accountKey={accountKey}
                    transaction={transaction}
                    tokenTransfer={tokenTransfer}
                    onShowMore={handleOpenModal}
                />
            ) : (
                <NetworkTransactionDetailSummary
                    accountKey={accountKey}
                    transaction={transaction}
                    onShowMore={handleOpenModal}
                />
            )}
            <TransactionDetailAddressesSheet
                ref={bottomSheetRef}
                txid={transaction.txid}
                accountKey={accountKey}
                onClose={closeModal}
                displayedAddressesType={displayedAddressesType}
                toggleAddresses={toggleAddresses}
            />
        </Card>
    );
};
