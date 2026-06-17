import { type EvmFeeHex } from '@suite-common/schemas/src/evm';
import { type StablecoinYieldClaimUnsignedTransaction } from '@suite-common/wallet-core';
import {
    type FeeInfo,
    type FormState,
    type PrecomposedLevels,
    type PrecomposedTransaction,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { calculateTotalGasCost, fromGwei, fromIntegerString } from '@suite-common/wallet-utils';
import { type FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

type BuildYieldClaimFeeLevelsParams = {
    availableBalance: string;
    feeInfo: FeeInfo;
    formDraft: FormState | undefined;
    gasLimit: string;
};

type YieldClaimFee = {
    gasLimit: string;
} & (
    | {
          gasPrice?: never;
          maxFeePerGas: string;
          maxPriorityFeePerGas: string;
      }
    | {
          gasPrice: string;
          maxFeePerGas?: never;
          maxPriorityFeePerGas?: never;
      }
);

const buildInsufficientFeeBalanceTransaction = (): PrecomposedTransaction => ({
    type: 'error',
    error: 'AMOUNT_IS_NOT_ENOUGH',
    errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
});

const buildYieldClaimFeeLevel = ({
    availableBalance,
    feeLevel,
}: {
    availableBalance: string;
    feeLevel: FeeLevel;
}): PrecomposedTransaction => {
    const feeRate = feeLevel.maxFeePerGas ?? feeLevel.feePerUnit;
    const gasLimit = feeLevel.feeLimit;

    if (!feeRate || !gasLimit) {
        return buildInsufficientFeeBalanceTransaction();
    }

    const fee = calculateTotalGasCost(fromGwei(feeRate).toWei(), gasLimit);

    if (new BigNumber(fee).gt(availableBalance)) {
        return buildInsufficientFeeBalanceTransaction();
    }

    return {
        type: 'final',
        totalSpent: fee,
        fee,
        feePerByte: feeRate,
        feeLimit: gasLimit,
        maxFeePerGas: feeLevel.maxFeePerGas,
        maxPriorityFeePerGas: feeLevel.maxPriorityFeePerGas,
        bytes: 0,
        inputs: [],
        outputs: [],
        outputsPermutation: [],
    };
};

const getCustomFeeLevel = ({
    formDraft,
    gasLimit,
}: Pick<BuildYieldClaimFeeLevelsParams, 'formDraft' | 'gasLimit'>): FeeLevel | null => {
    if (formDraft?.selectedFee !== 'custom') {
        return null;
    }

    if (formDraft.maxFeePerGas && formDraft.maxPriorityFeePerGas) {
        return {
            label: 'custom',
            blocks: -1,
            feePerUnit: formDraft.maxFeePerGas,
            feeLimit: formDraft.feeLimit || gasLimit,
            maxFeePerGas: formDraft.maxFeePerGas,
            maxPriorityFeePerGas: formDraft.maxPriorityFeePerGas,
        };
    }

    if (formDraft.feePerUnit) {
        return {
            label: 'custom',
            blocks: -1,
            feePerUnit: formDraft.feePerUnit,
            feeLimit: formDraft.feeLimit || gasLimit,
        };
    }

    return null;
};

export const buildYieldClaimFeeLevels = ({
    availableBalance,
    feeInfo,
    formDraft,
    gasLimit,
}: BuildYieldClaimFeeLevelsParams): PrecomposedLevels => {
    const feeLevels = feeInfo.levels.reduce<PrecomposedLevels>((levels, feeLevel) => {
        if (feeLevel.label === 'custom') {
            return levels;
        }

        const feeLevelWithClaimGasLimit = {
            ...feeLevel,
            feeLimit: gasLimit,
        };

        return {
            ...levels,
            [feeLevel.label]: buildYieldClaimFeeLevel({
                availableBalance,
                feeLevel: feeLevelWithClaimGasLimit,
            }),
        };
    }, {});

    const customFeeLevel = getCustomFeeLevel({ formDraft, gasLimit });

    if (!customFeeLevel) {
        return feeLevels;
    }

    return {
        ...feeLevels,
        custom: buildYieldClaimFeeLevel({
            availableBalance,
            feeLevel: customFeeLevel,
        }),
    };
};

export const getYieldClaimFee = (feePreview: PrecomposedTransactionFinal): YieldClaimFee | null => {
    if (!feePreview.feeLimit) {
        return null;
    }

    if (feePreview.maxFeePerGas && feePreview.maxPriorityFeePerGas) {
        return {
            gasLimit: feePreview.feeLimit,
            maxFeePerGas: fromGwei(feePreview.maxFeePerGas).toWei(),
            maxPriorityFeePerGas: fromGwei(feePreview.maxPriorityFeePerGas).toWei(),
        };
    }

    if (feePreview.feePerByte) {
        return {
            gasLimit: feePreview.feeLimit,
            gasPrice: fromGwei(feePreview.feePerByte).toWei(),
        };
    }

    return null;
};

export const getSelectedFeeFromUnsignedClaimTransaction = ({
    gasLimit,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
}: StablecoinYieldClaimUnsignedTransaction): EvmFeeHex => {
    const gasLimitHex = fromIntegerString(gasLimit).toHex();

    if (maxFeePerGas && maxPriorityFeePerGas) {
        return {
            type: 'eip1559',
            gasLimit: gasLimitHex,
            maxFeePerGas: fromIntegerString(maxFeePerGas).toHex(),
            maxPriorityFeePerGas: fromIntegerString(maxPriorityFeePerGas).toHex(),
            baseFeePerGas: '0x0',
        };
    }

    if (gasPrice) {
        return {
            type: 'legacy',
            gasLimit: gasLimitHex,
            gasPrice: fromIntegerString(gasPrice).toHex(),
        };
    }

    throw new Error('Claim transaction fee data is missing.');
};
