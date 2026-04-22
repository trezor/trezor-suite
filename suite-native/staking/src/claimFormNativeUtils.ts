import { numberToHex, toWei } from 'web3-utils';

import { type StakeFormState } from '@suite-common/wallet-types';
import {
    type EthereumTransaction,
    type EthereumTransactionEIP1559,
    type FeeLevel,
} from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

/** Pre-computed ABI encoding of contractAccounting.methods.claimWithdrawRequest().encodeABI() **/
export const CLAIM_CALLDATA = '0x33986ffa';

const toHex = (value: string | number): string => `0x${BigInt(value).toString(16)}`;

export const buildClaimFormState = (feeLevel: FeeLevel, gasLimit: string): StakeFormState => ({
    outputs: [],
    feePerUnit: feeLevel.feePerUnit,
    feeLimit: gasLimit,
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

export const buildEthClaimTx = ({
    contractAddress,
    chainId,
    nonce,
    gasLimit,
    feeLevel,
}: {
    contractAddress: string;
    chainId: number;
    nonce: number | string;
    gasLimit: string;
    feeLevel: FeeLevel;
}): EthereumTransaction | EthereumTransactionEIP1559 => {
    const gasLimitHex = toHex(
        new BigNumber(gasLimit).integerValue(BigNumber.ROUND_DOWN).toFixed(0),
    );

    const commonTxData = {
        to: contractAddress,
        value: '0x0',
        chainId,
        nonce: toHex(nonce),
        gasLimit: gasLimitHex,
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
