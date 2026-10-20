import { useMemo } from 'react';

import { classifyEthereumStakingTransaction } from '@suite-common/wallet-core';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from './FormattedCryptoAmount';

interface UnstakingTxAmountProps {
    transaction: WalletAccountTransaction;
}

export const UnstakingTxAmount = ({ transaction }: UnstakingTxAmountProps) => {
    const { solanaSpecific, tronSpecific, symbol } = transaction;

    const unstakeAmount = useMemo(() => {
        if (tronSpecific?.unstakeAmount) return tronSpecific.unstakeAmount;

        if (solanaSpecific?.stakeOperation?.type === 'unstake') {
            return solanaSpecific.stakeOperation.amount ?? '0';
        }

        const ethereumStaking = classifyEthereumStakingTransaction(transaction);
        if (ethereumStaking?.type === 'unstake') {
            return ethereumStaking.amount;
        }

        return undefined;
    }, [transaction, solanaSpecific, tronSpecific]);

    if (!unstakeAmount) return null;

    return (
        <>
            {' '}
            <FormattedCryptoAmount
                value={subunitsToUnits({
                    value: asAmountSubunit(new BigNumber(unstakeAmount)),
                    symbol,
                })}
                symbol={symbol}
            />
        </>
    );
};
