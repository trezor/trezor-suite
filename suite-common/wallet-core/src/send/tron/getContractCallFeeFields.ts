import { BigNumber } from '@trezor/utils';

import { type EstimateFeeLevel } from './types';

export const getContractCallFeeFields = (feeLevel: EstimateFeeLevel) => {
    const feeInSun = feeLevel.feePerTx || '0';
    const energyConsumed =
        feeLevel.feePerTx && feeLevel.feePerUnit && !new BigNumber(feeLevel.feePerUnit).isZero()
            ? new BigNumber(feeLevel.feePerTx).dividedToIntegerBy(feeLevel.feePerUnit).toNumber()
            : 0;

    return {
        fee: feeInSun,
        feeLimit: feeInSun,
        feePerByte: feeLevel.feePerUnit,
        energyConsumed,
    };
};
