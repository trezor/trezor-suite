import { fromWei, toWei } from 'web3-utils';

import { ExternalOutput, PrecomposedTransaction } from '@suite-common/wallet-types';
import {
    amountToSmallestUnit,
    calculateMax,
    calculateMaxEthFee,
    calculateTotal,
} from '@suite-common/wallet-utils';
import { FeeLevel, TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

export type CalculateEvmTxWithFeesProps = {
    availableBalance: string;
    output: ExternalOutput;
    feeLevel: FeeLevel;
    token?: TokenInfo;
};

/**
 * Calculate the effective gas price for eip1559 type transactions from maxPriorityFeePerGas and maxFeePerGas
 * @param maxPriorityFeePerGasGwei - maxPriorityFeePerGas in gwei
 * @param maxFeePerGasGwei - maxFeePerGas in gwei
 * @returns effective gas price in wei
 */

type CalculateEffectiveGasPriceProps = {
    maxFeePerGasGwei: string;
    maxPriorityFeePerGasGwei?: string;
};

export const calculateEffectiveGasPrice = ({
    maxFeePerGasGwei,
    maxPriorityFeePerGasGwei,
}: CalculateEffectiveGasPriceProps) => {
    if (!maxFeePerGasGwei) {
        return undefined;
    }
    if (!maxPriorityFeePerGasGwei) {
        maxPriorityFeePerGasGwei = '0';
    }
    const baseFee = BigNumber(toWei(maxFeePerGasGwei, 'gwei'));
    const priorityFee = BigNumber(toWei(maxPriorityFeePerGasGwei, 'gwei'));

    return baseFee.plus(priorityFee).toString();
};

/**
 * Calculate the base fee from effective gas price for eip1559 type transactions
 * @param effectiveGasPriceWei - effective gas price in wei
 * @param maxPriorityFeePerGasWei - maxPriorityFeePerGas in wei
 * @returns base fee in wei
 */

type CalculateBaseFeeFromEffectiveGasPriceProps = {
    effectiveGasPriceWei: string;
    maxPriorityFeePerGasWei?: string;
};

export const calculateBaseFeeFromEffectiveGasPrice = ({
    effectiveGasPriceWei,
    maxPriorityFeePerGasWei,
}: CalculateBaseFeeFromEffectiveGasPriceProps) => {
    if (!effectiveGasPriceWei) {
        return undefined;
    }
    if (!maxPriorityFeePerGasWei) {
        maxPriorityFeePerGasWei = '0';
    }
    const effectiveInWei = BigNumber(effectiveGasPriceWei);
    const priorityFee = BigNumber(maxPriorityFeePerGasWei);

    return effectiveInWei.minus(priorityFee).toString();
};

export const calculateEvmTxWithFees = ({
    availableBalance,
    output,
    feeLevel,
    token,
}: CalculateEvmTxWithFeesProps): PrecomposedTransaction => {
    let amount: string;
    let max: string | undefined;

    const eip1559 = feeLevel.maxPriorityFeePerGas
        ? {
              maxPriorityFeePerGas: feeLevel.maxPriorityFeePerGas,
              maxFeePerGas: feeLevel.maxFeePerGas,
              effectiveGasPrice: feeLevel.effectiveGasPrice,
          }
        : undefined;

    const feeInWei = eip1559
        ? calculateMaxEthFee(eip1559.effectiveGasPrice, feeLevel.feeLimit)
        : calculateMaxEthFee(feeLevel.feePerUnit, feeLevel.feeLimit);

    const availableTokenBalance = token
        ? amountToSmallestUnit(token.balance!, token.decimals)
        : undefined;

    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = availableTokenBalance || calculateMax(availableBalance, feeInWei);
        amount = max;
    } else {
        amount = output.amount;
    }

    // total ETH spent (amount + fee), in ERC20 only fee
    const totalSpent = new BigNumber(calculateTotal(token ? '0' : amount, feeInWei));

    if (totalSpent.isGreaterThan(availableBalance)) {
        if (token) {
            return {
                type: 'error',
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                errorMessage: {
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                    values: {
                        feeAmount: fromWei(feeInWei, 'ether').toString(),
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
        fee: feeInWei,
        maxFeePerGas: feeLevel.effectiveGasPrice,
        maxPriorityFeePerGas: feeLevel.maxPriorityFeePerGas,
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
