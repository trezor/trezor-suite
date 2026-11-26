import {
    type PrecomposedTransaction,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

export const validateEarnCustomFee = (fee: PrecomposedTransactionFinal): PrecomposedTransaction => {
    const { feeLimit, estimatedFeeLimit } = fee;

    return feeLimit && estimatedFeeLimit && new BigNumber(feeLimit).lt(estimatedFeeLimit)
        ? { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' }
        : fee;
};
