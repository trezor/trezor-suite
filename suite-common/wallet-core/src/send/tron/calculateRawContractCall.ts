import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type ExternalOutput, type PrecomposedTransaction } from '@suite-common/wallet-types';
import { calculateTotal } from '@suite-common/wallet-utils';
import { TRON_MEMO_FEE_SUN } from '@trezor/network-tron/constants';
import { BigNumber } from '@trezor/utils';

import { type EstimateFeeLevel } from './types';

export const calculateRawContractCall = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
    networkSymbol: NetworkSymbol,
    bytes: number,
    hasMemo: boolean,
): PrecomposedTransaction => {
    const baseFeeInSun = feeLevel.feePerTx || '0';
    const memoFeeInSun = hasMemo ? TRON_MEMO_FEE_SUN : 0;
    const totalFeeInSun = new BigNumber(baseFeeInSun).plus(memoFeeInSun).toString();
    const amount = 'amount' in output ? (output.amount ?? '0') : '0';

    if (new BigNumber(calculateTotal(amount, totalFeeInSun)).isGreaterThan(availableBalance)) {
        return {
            type: 'error',
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
            errorMessage: {
                id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                values: {
                    networkDisplaySymbol: getNetworkDisplaySymbol(networkSymbol),
                },
            },
        } as const;
    }

    const energyConsumed =
        feeLevel.feePerTx && feeLevel.feePerUnit && !new BigNumber(feeLevel.feePerUnit).isZero()
            ? new BigNumber(feeLevel.feePerTx).dividedToIntegerBy(feeLevel.feePerUnit).toNumber()
            : 0;
    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: amount,
        max: undefined,
        fee: baseFeeInSun,
        memoFee: hasMemo ? String(TRON_MEMO_FEE_SUN) : undefined,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit,
        energyConsumed,
        bytes,
        inputs: [],
    };

    if (output.type === 'payment') {
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
