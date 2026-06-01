import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type ExternalOutput, type PrecomposedTransaction } from '@suite-common/wallet-types';
import { TRON_MEMO_FEE_SUN, asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { type EstimateFeeLevel } from './types';

export const calculateTrc20Transfer = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
    token: TokenInfo,
    networkSymbol: NetworkSymbol,
    bytes: number,
    hasMemo: boolean,
): PrecomposedTransaction => {
    const baseFeeInSun = feeLevel.feePerTx || '0';
    const memoFeeInSun = hasMemo ? TRON_MEMO_FEE_SUN : 0;
    const totalFeeInSun = new BigNumber(baseFeeInSun).plus(memoFeeInSun).toString();
    const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';

    const tokenBalanceInSubunits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(token.balance ?? '0')),
        decimals: token.decimals,
    }).toString();
    const outputAmount = 'amount' in output ? (output.amount ?? '0') : '0';
    const amount = isSendMax ? tokenBalanceInSubunits : outputAmount;
    const max = isSendMax ? amount : undefined;

    if (new BigNumber(totalFeeInSun).isGreaterThan(availableBalance)) {
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
        max,
        fee: baseFeeInSun,
        memoFee: hasMemo ? String(TRON_MEMO_FEE_SUN) : undefined,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit, // energy cap in energy units; fee_limit in the signed tx uses the equivalent in SUN (feeLimit × feePerUnit)
        energyConsumed,
        bytes,
        inputs: [],
        token,
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
