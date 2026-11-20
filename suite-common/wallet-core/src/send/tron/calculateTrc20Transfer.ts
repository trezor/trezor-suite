import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type ExternalOutput, type PrecomposedTransaction } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    calculateTronFeeBreakdown,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';
import { type TokenInfo } from '@trezor/connect';
import { TRON_MEMO_FEE_SUN } from '@trezor/network-tron/constants';
import { BigNumber } from '@trezor/utils';

import { getContractCallFeeFields } from './getContractCallFeeFields';
import { type EstimateFeeLevel } from './types';

export const calculateTrc20Transfer = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
    token: TokenInfo,
    networkSymbol: NetworkSymbol,
    bytes: number,
    hasMemo: boolean,
    tronResources?: TronAccountExtraData,
): PrecomposedTransaction => {
    const feeFields = getContractCallFeeFields(feeLevel);
    const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';

    const tokenBalanceInSubunits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(token.balance ?? '0')),
        decimals: token.decimals,
    }).toString();
    const outputAmount = 'amount' in output ? (output.amount ?? '0') : '0';
    const amount = isSendMax ? tokenBalanceInSubunits : outputAmount;
    const max = isSendMax ? amount : undefined;

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: amount,
        max,
        memoFee: hasMemo ? String(TRON_MEMO_FEE_SUN) : undefined,
        ...feeFields,
        bytes,
        inputs: [],
        token,
    };
    const burnedFeeSun = calculateTronFeeBreakdown(
        payloadData,
        tronResources,
        networkSymbol,
        payloadData.feeLimit,
    )?.burnedFeeSun;

    if (!burnedFeeSun || burnedFeeSun.isGreaterThan(availableBalance)) {
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

    if (output.type === 'send-max' || output.type === 'payment') {
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
