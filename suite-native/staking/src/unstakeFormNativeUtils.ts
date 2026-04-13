import { transformTx } from '@suite-common/staking';
import { UNSTAKE_INTERCHANGES, WALLET_SDK_SOURCE } from '@suite-common/wallet-constants';
import { type StakeFormState } from '@suite-common/wallet-types';
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
    gasLimit: string,
    calldata: string,
): StakeFormState => ({
    outputs: [],
    feePerUnit: feeLevel.feePerUnit,
    feeLimit: gasLimit,
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

export const buildEthUnstakeTx = ({
    contractAddress,
    amount,
    chainId,
    nonce,
    gasLimit,
    feeLevel,
}: {
    contractAddress: string;
    amount: string;
    chainId: number;
    nonce: number | string;
    gasLimit: string;
    feeLevel: FeeLevel;
}): EthereumTransaction | EthereumTransactionEIP1559 => {
    const amountInWei = ethToWei(amount);
    const data = buildUnstakeCalldata(amountInWei);
    const tx = {
        to: contractAddress,
        value: '0', // No ETH value for unstake
        gasLimit: new BigNumber(gasLimit).integerValue(BigNumber.ROUND_DOWN).toNumber(),
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
