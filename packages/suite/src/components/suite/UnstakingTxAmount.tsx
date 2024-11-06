import React from 'react';

import { WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    isUnstakeTx,
    getUnstakeAmountByEthereumDataHex,
} from '@suite-common/wallet-utils';

import { FormattedCryptoAmount } from './FormattedCryptoAmount';

interface UnstakingTxAmountProps {
    transaction: WalletAccountTransaction;
}

export const UnstakingTxAmount = ({ transaction }: UnstakingTxAmountProps) => {
    const { ethereumSpecific, symbol } = transaction;
    const txSignature = ethereumSpecific?.parsedData?.methodId;

    if (!isUnstakeTx(txSignature)) return null;

    const amount = getUnstakeAmountByEthereumDataHex(ethereumSpecific?.data);

    if (!amount) return null;

    return <FormattedCryptoAmount value={formatNetworkAmount(amount, symbol)} symbol={symbol} />;
};
