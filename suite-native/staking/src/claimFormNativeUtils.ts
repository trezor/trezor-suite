import { numberToHex, toWei } from 'web3-utils';

import { STAKE_GAS_LIMIT_RESERVE } from '@suite-common/wallet-constants';
import { type PrecomposedTransactionFinal, type StakeFormState } from '@suite-common/wallet-types';
import {
    type EthereumTransaction,
    type EthereumTransactionEIP1559,
    type FeeLevel,
} from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

/** Pre-computed ABI encoding of contractAccounting.methods.claimWithdrawRequest().encodeABI() **/
export const CLAIM_CALLDATA = '0x33986ffa';

const toHex = (value: string | number): string => `0x${BigInt(value).toString(16)}`;

export const buildClaimFormState = (feeLevel: FeeLevel, rawGasLimit: string): StakeFormState => ({
    outputs: [],
    feePerUnit: feeLevel.feePerUnit,
    feeLimit: rawGasLimit,
    transactionData: CLAIM_CALLDATA,
    stakeType: 'claim',
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

export const buildClaimPrecomposedTx = (
    feeLevel: FeeLevel,
    rawGasLimit: string,
    contractAddress: string,
): PrecomposedTransactionFinal => {
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
                amount: '0',
            },
        ],
        outputsPermutation: [0],
        fee,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: rawGasLimit,
        bytes: 0,
        totalSpent: fee,
        ...(feeLevel.maxFeePerGas
            ? {
                  maxFeePerGas: feeLevel.maxFeePerGas,
                  maxPriorityFeePerGas: feeLevel.maxPriorityFeePerGas ?? '0',
              }
            : {}),
    };
};

export const buildEthClaimTx = ({
    contractAddress,
    chainId,
    nonce,
    rawGasLimit,
    feeLevel,
}: {
    contractAddress: string;
    chainId: number;
    nonce: number | string;
    rawGasLimit: string;
    feeLevel: FeeLevel;
}): EthereumTransaction | EthereumTransactionEIP1559 => {
    const gasLimit = toHex(
        new BigNumber(rawGasLimit)
            .plus(STAKE_GAS_LIMIT_RESERVE)
            .integerValue(BigNumber.ROUND_DOWN)
            .toNumber(),
    );

    const commonTxData = {
        to: contractAddress,
        value: '0x0',
        chainId,
        nonce: toHex(nonce),
        gasLimit,
        data: CLAIM_CALLDATA,
    };

    if (feeLevel.maxFeePerGas) {
        return {
            ...commonTxData,
            gasPrice: undefined,
            maxFeePerGas: numberToHex(toWei(feeLevel.maxFeePerGas, 'gwei')),
            maxPriorityFeePerGas: numberToHex(toWei(feeLevel.maxPriorityFeePerGas ?? '0', 'gwei')),
        };
    }

    return {
        ...commonTxData,
        gasPrice: numberToHex(toWei(feeLevel.feePerUnit, 'gwei')),
    };
};
