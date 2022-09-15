import React from 'react';

import { Box } from '@suite-native/atoms';
import { WalletAccountTransaction } from '@suite-common/wallet-types';

import { TransactionDetailDataRow } from './TransactionDetailDataRow';

type TransactionDetailDataProps = {
    transaction: WalletAccountTransaction;
};

export const TransactionDetailData = ({ transaction }: TransactionDetailDataProps) => {
    const getBlockTime = () => {
        if (!transaction.blockTime) return '';
        return new Date(transaction.blockTime * 1000).toLocaleTimeString();
    };

    return (
        <Box>
            <TransactionDetailDataRow label="Date" value={getBlockTime()} />
            <TransactionDetailDataRow label="Account" value={transaction.descriptor} />
            {/*  TODO add targets  */}
        </Box>
    );
};
