import React from 'react';
import { getUnstakeAmountByEthereumDataHex, isUnstakeTx } from '@suite-common/suite-utils';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
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
