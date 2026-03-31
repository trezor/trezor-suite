import { transformTx } from '@suite-common/staking';
import {
    STAKE_GAS_LIMIT_RESERVE,
    UNSTAKE_INTERCHANGES,
    WALLET_SDK_SOURCE,
} from '@suite-common/wallet-constants';
import { type PrecomposedTransactionFinal, type StakeFormState } from '@suite-common/wallet-types';
import {
    type EthereumTransaction,
    type EthereumTransactionEIP1559,
    type FeeLevel,
} from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { ethToWei } from './utils';

/**
 * ABI-encodes unstake(uint256 amountWei, uint16 interchanges, uint64 source).
 * The web version uses @everstake/wallet-sdk-ethereum which is not React Native compatible.
 */
export const buildUnstakeCalldata = (amountWei: string): string => {
    const UNSTAKE_SELECTOR = '76ec871c';
    const pad32 = (hex: string) => hex.replace('0x', '').padStart(64, '0');

    return [
        `0x${UNSTAKE_SELECTOR}`,
        pad32(BigInt(amountWei).toString(16)),
        pad32(BigInt(UNSTAKE_INTERCHANGES).toString(16)),
        pad32(BigInt(WALLET_SDK_SOURCE).toString(16)),
    ].join('');
};

export const buildUnstakeFormState = (
    feeLevel: FeeLevel,
    rawGasLimit: string,
    calldata: string,
): StakeFormState => ({
    outputs: [],
    feePerUnit: feeLevel.feePerUnit,
    feeLimit: rawGasLimit,
    transactionData: calldata,
    stakeType: 'unstake',
    options: [],
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    ...(feeLevel.maxFeePerGas
        ? {
              maxFeePerGas: feeLevel.maxFeePerGas,
              maxPriorityFeePerGas: feeLevel.maxPriorityFeePerGas ?? '0',
              baseFeePerGas: feeLevel.baseFeePerGas ?? undefined,
          }
        : {}),
});

export const buildUnstakePrecomposedTx = (
    feeLevel: FeeLevel,
    rawGasLimit: string,
    contractAddress: string,
    amount: string,
): PrecomposedTransactionFinal => {
    const amountInWei = ethToWei(amount);
    const gasLimitWithReserve = new BigNumber(rawGasLimit).plus(STAKE_GAS_LIMIT_RESERVE);
    const gasPriceGwei = feeLevel.maxFeePerGas ?? feeLevel.feePerUnit;
    const fee = new BigNumber(gasPriceGwei)
        .times(gasLimitWithReserve)
        .times(new BigNumber(10).pow(9))
        .toFixed(0);

    return {
        type: 'final',
        inputs: [],
        outputs: [
            {
                address: contractAddress,
                script_type: 'PAYTOADDRESS',
                amount: amountInWei,
            },
        ],
        outputsPermutation: [0],
        fee,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: rawGasLimit,
        bytes: 0,
        totalSpent: fee, // No ETH value is sent for unstake; total spent = fee only
        ...(feeLevel.maxFeePerGas
            ? {
                  maxFeePerGas: feeLevel.maxFeePerGas,
                  maxPriorityFeePerGas: feeLevel.maxPriorityFeePerGas ?? '0',
              }
            : {}),
    };
};

export const buildEthUnstakeTx = ({
    contractAddress,
    amount,
    chainId,
    nonce,
    rawGasLimit,
    feeLevel,
}: {
    contractAddress: string;
    amount: string;
    chainId: number;
    nonce: number | string;
    rawGasLimit: string;
    feeLevel: FeeLevel;
}): EthereumTransaction | EthereumTransactionEIP1559 => {
    const adjustedGasLimit = new BigNumber(rawGasLimit)
        .plus(STAKE_GAS_LIMIT_RESERVE)
        .integerValue(BigNumber.ROUND_DOWN)
        .toNumber();
    const amountInWei = ethToWei(amount);
    const data = buildUnstakeCalldata(amountInWei);
    const tx = {
        to: contractAddress,
        value: '0', // No ETH value for unstake
        gasLimit: adjustedGasLimit,
        data,
    };

    return transformTx(
        tx,
        String(nonce),
        chainId,
        feeLevel.maxFeePerGas ? undefined : feeLevel.feePerUnit,
        feeLevel.maxFeePerGas,
        feeLevel.maxPriorityFeePerGas,
    );
};
