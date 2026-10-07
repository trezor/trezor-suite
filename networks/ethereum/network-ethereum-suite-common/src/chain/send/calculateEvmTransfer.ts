import type { TokenInfo } from '@trezor/blockchain-link-types';
import type { FeeLevel } from '@trezor/connect-common';
import {
    type ExternalOutput,
    type PrecomposedTransaction,
    calculateMax,
    calculateTotal,
    convertAmountUnitsToSubunits,
    getMaxAmountWithReserve,
    isNetworkReserveApplicable,
} from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

import { fromGwei, fromWei } from './evm/ethConverter';
import { calculateTotalGasCost } from './evm/evmTransaction';

export type EvmMaxReserve = {
    decimals: number;

    /** The account balance in units. */
    formattedBalance: string;
    isNetworkReserveEnabled: boolean;
    nativeTokenReserve: string | undefined;
};

/**
 * One coin or token transfer at a fee level: the gas limit times the (max) fee per gas.
 *
 * @param reserve What sending the maximum keeps back for later fees; without it nothing is kept.
 */
export const calculateEvmTransfer = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    token?: TokenInfo,
    reserve?: EvmMaxReserve,
): PrecomposedTransaction => {
    let amount: string;
    let max: string | undefined;

    const totalGasCostInWei = calculateTotalGasCost(
        fromGwei(feeLevel.maxFeePerGas || feeLevel.feePerUnit).toWei(),
        feeLevel.feeLimit,
    );

    const availableTokenBalance = token
        ? convertAmountUnitsToSubunits(token.balance!, token.decimals)
        : undefined;

    const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';

    const consumesEntireFee =
        isSendMax && !token && feeLevel.label !== 'custom' && !!feeLevel.maxFeePerGas;

    if (isSendMax) {
        max = availableTokenBalance || calculateMax(availableBalance, totalGasCostInWei);

        if (reserve) {
            const factor = new BigNumber(10).exponentiatedBy(reserve.decimals);

            max = getMaxAmountWithReserve({
                networkReserve: isNetworkReserveApplicable(
                    token?.contract,
                    reserve.isNetworkReserveEnabled,
                )
                    ? reserve.nativeTokenReserve
                    : undefined,
                balance: reserve.formattedBalance,
                amount: new BigNumber(max).div(factor).toString(),
                fee: new BigNumber(totalGasCostInWei).div(factor).toString(),
            });

            max = new BigNumber(max).multipliedBy(factor).toString();
        }

        amount = max;
    } else {
        amount = output.amount;
    }

    // total ETH spent (amount + fee), in ERC20 only fee
    const totalSpent = new BigNumber(calculateTotal(token ? '0' : amount, totalGasCostInWei));

    if (totalSpent.isGreaterThan(availableBalance)) {
        if (token) {
            return {
                type: 'error',
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                errorMessage: {
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                    values: {
                        feeAmount: fromWei(totalGasCostInWei).toEther(),
                    },
                },
            } as const;
        }

        return {
            type: 'error',
            error: 'AMOUNT_IS_NOT_ENOUGH',
            errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
        } as const;
    }

    // validate if token balance is not 0 or lower than amount
    if (
        availableTokenBalance &&
        (availableTokenBalance === '0' || new BigNumber(amount).gt(availableTokenBalance))
    ) {
        return {
            type: 'error',
            error: 'AMOUNT_IS_NOT_ENOUGH',
            errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
        } as const;
    }

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: token ? amount : totalSpent.toString(),
        max,
        fee: totalGasCostInWei,
        maxFeePerGas: feeLevel.maxFeePerGas,
        maxPriorityFeePerGas: consumesEntireFee
            ? feeLevel.maxFeePerGas
            : feeLevel.maxPriorityFeePerGas,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit,
        token,
        bytes: 0, // TODO: calculate
        inputs: [],
    };

    if (output.type === 'send-max' || output.type === 'payment') {
        return {
            ...payloadData,
            type: 'final',
            // compatibility with BTC PrecomposedTransaction from @trezor/connect
            inputs: [],
            outputsPermutation: [0],
            outputs: [
                {
                    address: output.address,
                    amount,
                    script_type: 'PAYTOADDRESS',
                },
            ],
        };
    }

    return payloadData;
};
