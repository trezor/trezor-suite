import type {
    ComposedStakingStep,
    StakingFeeLevel,
    StakingFeeLevelExtraValue,
    StakingStepOutput,
} from '@suite-common/earn-staking-common';
import type {
    PrecomposedLevels,
    PrecomposedTransaction,
    PrecomposedTransactionError,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';

const getStringExtra = (value: StakingFeeLevelExtraValue | undefined) =>
    typeof value === 'string' ? value : undefined;

const getNumberExtra = (value: StakingFeeLevelExtraValue | undefined) =>
    typeof value === 'number' ? value : undefined;

const toPrecomposedTransaction = (
    level: StakingFeeLevel,
    outputs: readonly StakingStepOutput[],
): PrecomposedTransaction => {
    if (level.type === 'error') {
        return {
            type: 'error',
            error: level.error,
            errorMessage: level.errorMessage ?? undefined,
        } as PrecomposedTransactionError;
    }

    return {
        type: 'final',
        fee: level.fee,
        totalSpent: level.totalSpent,
        feePerByte: level.feePerUnit,
        feeLimit: level.feeLimit ?? undefined,
        max: level.max ?? undefined,
        bytes: getNumberExtra(level.extras.bytes) ?? 0,
        inputs: [],
        outputs: outputs.map(output => ({
            address: output.address,
            amount: output.amount,
            script_type: 'PAYTOADDRESS',
        })),
        outputsPermutation: outputs.map((_output, index) => index),
        estimatedFeeLimit: getStringExtra(level.extras.estimatedFeeLimit),
        maxFeePerGas: getStringExtra(level.extras.maxFeePerGas),
        maxPriorityFeePerGas: getStringExtra(level.extras.maxPriorityFeePerGas),
    } satisfies PrecomposedTransactionFinal;
};

export const toPrecomposedLevels = (composedStep: ComposedStakingStep): PrecomposedLevels =>
    Object.fromEntries(
        Object.entries(composedStep.feeLevels).flatMap(([label, level]) =>
            level === undefined
                ? []
                : [[label, toPrecomposedTransaction(level, composedStep.outputs)]],
        ),
    );
