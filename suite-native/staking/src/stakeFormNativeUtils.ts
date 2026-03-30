import { transformTx } from '@suite-common/staking';
import { STAKE_GAS_LIMIT_RESERVE } from '@suite-common/wallet-constants';
import { type PrecomposedTransactionFinal, type StakeFormState } from '@suite-common/wallet-types';
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

export const selectPreferredFeeLevel = (levels: FeeLevel[] | undefined): FeeLevel | undefined =>
    levels?.find(l => l.label === 'high') ?? levels?.find(l => l.label === 'normal') ?? levels?.[0];

export const buildStakeFormState = (feeLevel: FeeLevel, rawGasLimit: string): StakeFormState => ({
    outputs: [],
    feePerUnit: feeLevel.feePerUnit,
    feeLimit: rawGasLimit,
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

export const buildStakePrecomposedTx = (
    feeLevel: FeeLevel,
    rawGasLimit: string,
    contractAddress: string,
    amount: string,
): PrecomposedTransactionFinal => {
    const amountInWei = new BigNumber(amount)
        .times(new BigNumber(10).pow(18))
        .integerValue()
        .toFixed(0);
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
        totalSpent: amountInWei,
        ...(feeLevel.maxFeePerGas
            ? {
                  maxFeePerGas: feeLevel.maxFeePerGas,
                  maxPriorityFeePerGas: feeLevel.maxPriorityFeePerGas ?? '0',
              }
            : {}),
    };
};

export const buildEthStakeTx = ({
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
    const amountWei = new BigNumber(amount)
        .times(new BigNumber(10).pow(18))
        .integerValue()
        .toFixed(0);
    const tx = {
        to: contractAddress,
        value: amountWei,
        gasLimit: adjustedGasLimit,
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
