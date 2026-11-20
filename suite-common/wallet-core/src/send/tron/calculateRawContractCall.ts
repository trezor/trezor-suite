import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type ExternalOutput, type PrecomposedTransaction } from '@suite-common/wallet-types';
import { calculateTronFeeBreakdown } from '@suite-common/wallet-utils';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';
import { TRON_MEMO_FEE_SUN } from '@trezor/network-tron/constants';

import { getContractCallFeeFields } from './getContractCallFeeFields';
import { type EstimateFeeLevel } from './types';

export const calculateRawContractCall = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
    networkSymbol: NetworkSymbol,
    bytes: number,
    hasMemo: boolean,
    tronResources?: TronAccountExtraData,
): PrecomposedTransaction => {
    const feeFields = getContractCallFeeFields(feeLevel);
    const amount = 'amount' in output ? (output.amount ?? '0') : '0';

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: amount,
        max: undefined,
        memoFee: hasMemo ? String(TRON_MEMO_FEE_SUN) : undefined,
        ...feeFields,
        bytes,
        inputs: [],
    };
    const burnedFeeSun = calculateTronFeeBreakdown(
        payloadData,
        tronResources,
        networkSymbol,
        payloadData.feeLimit,
    )?.burnedFeeSun;

    if (!burnedFeeSun || burnedFeeSun.plus(amount).isGreaterThan(availableBalance)) {
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

    if (output.type === 'payment') {
        return {
            ...payloadData,
            burnedFee: burnedFeeSun.toString(),
            type: 'final',
            inputs: [],
            outputsPermutation: [0],
            outputs: [{ address: output.address, amount, script_type: 'PAYTOADDRESS' }],
        };
    }

    return { ...payloadData, burnedFee: burnedFeeSun.toString() };
};
