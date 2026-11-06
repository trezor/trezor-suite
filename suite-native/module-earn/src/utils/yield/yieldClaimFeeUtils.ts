import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { fromGwei } from '@suite-common/wallet-utils';

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
