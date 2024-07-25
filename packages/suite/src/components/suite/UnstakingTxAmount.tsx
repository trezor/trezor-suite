import React from 'react';
import { isUnstakeTx } from '@suite-common/suite-utils';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { getUnstakingAmount } from 'src/utils/suite/stake';
import { FormattedCryptoAmount } from './FormattedCryptoAmount';

interface UnstakingTxAmountProps {
    transaction: WalletAccountTransaction;
}

export const UnstakingTxAmount = ({ transaction }: UnstakingTxAmountProps) => {
    const { ethereumSpecific, symbol } = transaction;
    const txSignature = ethereumSpecific?.parsedData?.methodId;

    if (!isUnstakeTx(txSignature)) return null;

    const amount = getUnstakingAmount(ethereumSpecific?.data);

    if (!amount) return null;

    return <FormattedCryptoAmount value={formatNetworkAmount(amount, symbol)} symbol={symbol} />;
};
