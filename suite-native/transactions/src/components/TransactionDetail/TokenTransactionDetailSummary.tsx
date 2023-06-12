import React from 'react';

import { AccountKey } from '@suite-common/wallet-types';
import { EthereumTokenTransfer } from '@suite-native/ethereum-tokens';
import { VStack } from '@suite-native/atoms';

import { TransactionDetailAddressesSection } from './TransactionDetailAddressesSection';
import { TransactionDetailStatusSection } from './TransactionDetailStatusSection';

export const TokenTransactionDetailSummary = ({
    accountKey,
    txid,
    tokenTransfer,
    onShowMore,
}: {
    accountKey: AccountKey;
    txid: string;
    tokenTransfer: EthereumTokenTransfer;
    onShowMore: () => void;
}) => (
    <VStack>
        <TransactionDetailAddressesSection
            addressesType="inputs"
            addresses={[tokenTransfer.from]}
            icon={tokenTransfer.contract}
            onShowMore={onShowMore}
        />
        <TransactionDetailStatusSection txid={txid} accountKey={accountKey} />
        <TransactionDetailAddressesSection
            addressesType="outputs"
            addresses={[tokenTransfer.to]}
            onShowMore={onShowMore}
        />
    </VStack>
);
