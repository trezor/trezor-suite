import React from 'react';

import { WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getUnstakeAmountByEthereumDataHex,
    isUnstakeTx,
} from '@suite-common/wallet-utils';

import { FormattedCryptoAmount } from './FormattedCryptoAmount';

interface UnstakingTxAmountProps {
    transaction: WalletAccountTransaction;
}

export const UnstakingTxAmount = ({ transaction }: UnstakingTxAmountProps) => {
    const { ethereumSpecific, solanaSpecific, symbol } = transaction;

    const solanaStakeType = solanaSpecific?.stakeType;

    // Handle Solana unstake transaction
    if (solanaStakeType === 'unstake') {
        const unstakeAmount = solanaSpecific?.unstakeAmount ?? '0';

        return (
            <FormattedCryptoAmount
                value={formatNetworkAmount(unstakeAmount, symbol)}
                symbol={symbol}
            />
        );
    }

    // Handle Ethereum unstake transaction
    const txSignature = ethereumSpecific?.parsedData?.methodId;
    if (!isUnstakeTx(txSignature)) return null;

    const unstakeEthAmount = getUnstakeAmountByEthereumDataHex(ethereumSpecific?.data);
    if (!unstakeEthAmount) return null;

    return (
        <FormattedCryptoAmount
            value={formatNetworkAmount(unstakeEthAmount, symbol)}
            symbol={symbol}
        />
    );
};
