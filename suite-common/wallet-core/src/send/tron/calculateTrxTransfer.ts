import { type ExternalOutput, type PrecomposedTransaction } from '@suite-common/wallet-types';
import { calculateMax, calculateTotal } from '@suite-common/wallet-utils';
import { TRON_ACCOUNT_ACTIVATION_FEE_SUN, TRON_MEMO_FEE_SUN } from '@trezor/network-tron/constants';
import { BigNumber } from '@trezor/utils';

import { type EstimateFeeLevel } from './types';

export const calculateTrxTransfer = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
    isNewAccount: boolean,
    bytes: number,
    hasMemo: boolean,
): PrecomposedTransaction => {
    const baseFeeInSun = feeLevel.feePerTx || '0';
    const activationFeeInSun = isNewAccount ? TRON_ACCOUNT_ACTIVATION_FEE_SUN : 0;
    const memoFeeInSun = hasMemo ? TRON_MEMO_FEE_SUN : 0;
    const totalFeeInSun = new BigNumber(baseFeeInSun)
        .plus(activationFeeInSun)
        .plus(memoFeeInSun)
        .toString();
    const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';

    let amount: string;
    let max: string | undefined;

    if (isSendMax) {
        max = calculateMax(availableBalance, totalFeeInSun);
        amount = max;
    } else {
        amount = 'amount' in output ? output.amount : '0';
    }

    if (new BigNumber(calculateTotal(amount, totalFeeInSun)).isGreaterThan(availableBalance)) {
        return {
            type: 'error',
            error: 'AMOUNT_IS_NOT_ENOUGH',
            errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
        } as const;
    }

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: calculateTotal(amount, totalFeeInSun),
        max,
        // Everything the network takes for a native TRX transfer: the bandwidth burn or the flat
        // create-account fee, plus the activation fee and the memo fee. One number drives the
        // reserve, the displayed fee and trading alike. TRC-20 and raw contract calls keep `fee`
        // as the pure energy cap instead — there it is what ends up in the signed `fee_limit`.
        fee: totalFeeInSun,
        accountActivationFee: isNewAccount ? String(TRON_ACCOUNT_ACTIVATION_FEE_SUN) : undefined,
        memoFee: hasMemo ? String(TRON_MEMO_FEE_SUN) : undefined,
        feePerByte: feeLevel.feePerUnit,
        bytes,
        inputs: [],
    };

    if (output.type === 'send-max' || output.type === 'payment') {
        return {
            ...payloadData,
            type: 'final',
            inputs: [],
            outputsPermutation: [0],
            outputs: [{ address: output.address, amount, script_type: 'PAYTOADDRESS' }],
        };
    }

    return payloadData;
};
