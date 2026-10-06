import { buildEvmSelectedFee } from '@suite-common/wallet-core';
import { type EvmSelectedFee, type FormState } from '@suite-common/wallet-types';

type FormDraftEvmFeeFields = Pick<
    FormState,
    'feeLimit' | 'feePerUnit' | 'maxFeePerGas' | 'maxPriorityFeePerGas'
>;

export const getSelectedEvmFeeFromFormDraft = (
    formDraft: FormDraftEvmFeeFields | null | undefined,
): EvmSelectedFee | null => {
    if (!formDraft?.feeLimit) {
        return null;
    }

    const { feeLimit, feePerUnit, maxFeePerGas, maxPriorityFeePerGas } = formDraft;

    if (maxFeePerGas && maxPriorityFeePerGas) {
        return buildEvmSelectedFee({
            feeLevel: {
                feePerUnit: feePerUnit || maxFeePerGas,
                maxFeePerGas,
                maxPriorityFeePerGas,
                baseFeePerGas: '0',
            },
            gasLimit: feeLimit,
        });
    }

    if (feePerUnit) {
        return buildEvmSelectedFee({
            feeLevel: { feePerUnit },
            gasLimit: feeLimit,
        });
    }

    return null;
};
