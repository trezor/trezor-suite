import { buildEvmSelectedFee } from '@suite-common/wallet-core';
import { type EvmSelectedFee, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

export const getSelectedEvmFeeFromPrecomposedTransaction = (
    precomposedTransaction: PrecomposedTransactionFinal | undefined,
): EvmSelectedFee | null => {
    if (!precomposedTransaction?.feeLimit) {
        return null;
    }

    if (precomposedTransaction.maxFeePerGas && precomposedTransaction.maxPriorityFeePerGas) {
        return buildEvmSelectedFee({
            feeLevel: {
                feePerUnit: precomposedTransaction.feePerByte,
                maxFeePerGas: precomposedTransaction.maxFeePerGas,
                maxPriorityFeePerGas: precomposedTransaction.maxPriorityFeePerGas,
                baseFeePerGas: '0',
            },
            gasLimit: precomposedTransaction.feeLimit,
        });
    }

    if (precomposedTransaction.feePerByte) {
        return buildEvmSelectedFee({
            feeLevel: { feePerUnit: precomposedTransaction.feePerByte },
            gasLimit: precomposedTransaction.feeLimit,
        });
    }

    return null;
};
