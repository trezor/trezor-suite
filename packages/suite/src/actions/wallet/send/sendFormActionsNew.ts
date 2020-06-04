import BigNumber from 'bignumber.js';
import { Account } from '@wallet-types';
import { networkAmountToSatoshi, formatNetworkAmount } from '@wallet-utils/accountUtils';
import { calculateMax, calculateTotal } from '@wallet-utils/sendFormUtils';

/*
    Compose xrp transaction
 */
export const composeXrpTransaction = (
    amount: string,
    account: Account,
    // selectedFee,
) => {
    const { symbol, availableBalance } = account;
    const amountInSatoshi = networkAmountToSatoshi(amount, symbol).toString();
    const feeInSatoshi = '1';
    // const feeInSatoshi = selectedFee.feePerUnit;
    const totalSpentBig = new BigNumber(calculateTotal(amountInSatoshi, feeInSatoshi));
    const max = new BigNumber(calculateMax(availableBalance, feeInSatoshi));
    const payloadData = {
        totalSpent: totalSpentBig.toString(),
        fee: feeInSatoshi,
        max: max.isLessThan('0') ? '' : formatNetworkAmount(max.toFixed(), 'xrp'),
    };

    if (totalSpentBig.isGreaterThan(availableBalance)) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' } as const;
    }

    return { type: 'final', ...payloadData } as const;
};
