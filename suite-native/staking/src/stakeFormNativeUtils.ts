import { transformTx } from '@suite-common/staking';
import { type StakeFormState } from '@suite-common/wallet-types';
import {
    type EthereumTransaction,
    type EthereumTransactionEIP1559,
    type FeeLevel,
} from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

/** The web version derives this at runtime via @everstake/wallet-sdk-ethereum, which is not React Native compatible, so we use the pre-computed constant here. **/
export const STAKE_CALLDATA =
    '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001';

export type StakePushTransactionError =
    | { error: 'push-transaction-failed'; message?: string }
    | { error: 'push-transaction-pending-conflict'; message?: string };

export const buildStakeFormState = (feeLevel: FeeLevel, gasLimit: string): StakeFormState => ({
    outputs: [],
    feePerUnit: feeLevel.feePerUnit,
    feeLimit: gasLimit,
    transactionData: STAKE_CALLDATA,
    stakeType: 'stake',
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

export const buildEthStakeTx = ({
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
    const amountWei = new BigNumber(amount)
        .times(new BigNumber(10).pow(18))
        .integerValue()
        .toFixed(0);
    const tx = {
        to: contractAddress,
        value: amountWei,
        gasLimit: new BigNumber(gasLimit).integerValue(BigNumber.ROUND_DOWN).toNumber(),
        data: STAKE_CALLDATA,
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
