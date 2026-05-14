import { fromWei, toWei } from 'web3-utils';

import { type PrecomposedTransaction } from '@suite-common/wallet-types';
import { calculateTotalGasCost } from '@suite-common/wallet-utils';
import { type FeeLevel, type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

export const buildAllowanceTransaction = (
    balance: string,
    contract: string,
    feeLevel: FeeLevel,
    networkDisplaySymbol: string,
    token?: TokenInfo,
    estimatedFeeLimit?: string,
): PrecomposedTransaction => {
    const gasPrice = feeLevel.maxFeePerGas || feeLevel.feePerUnit;

    const fee = calculateTotalGasCost(toWei(gasPrice, 'gwei'), feeLevel.feeLimit);

    if (new BigNumber(fee).gt(balance)) {
        return {
            type: 'error',
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
            errorMessage: {
                id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                values: {
                    feeAmount: fromWei(fee, 'ether'),
                    networkDisplaySymbol,
                },
            },
        };
    }

    return {
        type: 'final',
        totalSpent: '0',
        fee,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit,
        maxFeePerGas: feeLevel.maxFeePerGas,
        maxPriorityFeePerGas: feeLevel.maxPriorityFeePerGas,
        estimatedFeeLimit,
        token,
        bytes: 0,
        inputs: [],
        outputsPermutation: [0],
        outputs: [
            {
                address: contract,
                amount: '0',
                script_type: 'PAYTOADDRESS',
            },
        ],
    };
};
