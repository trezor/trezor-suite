import { parseUnsignedEvmTransactionForSigning } from '@suite-common/earn-stablecoin-api';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { calculateTotalGasCost, fromHex } from '@suite-common/wallet-utils';

type ParsedUnsignedEvmTransaction = NonNullable<
    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
>;

const buildPrecomposedTransaction = (
    tx: ParsedUnsignedEvmTransaction,
): PrecomposedTransactionFinal | null => {
    const gasPriceHex = tx.maxFeePerGas ?? tx.gasPrice;

    if (!gasPriceHex) {
        return null;
    }

    const gasLimit = fromHex(tx.gasLimit).toBigNumber().toFixed(0);
    const gasPrice = fromHex(gasPriceHex).toBigNumber().toFixed(0);
    const feePerByte = fromHex(gasPriceHex).asWei().toGwei();
    const fee = calculateTotalGasCost(gasPrice, gasLimit);
    const eip1559Fields: Partial<
        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
    > =
        tx.maxFeePerGas && tx.maxPriorityFeePerGas
            ? {
                  maxFeePerGas: fromHex(tx.maxFeePerGas).asWei().toGwei(),
                  maxPriorityFeePerGas: fromHex(tx.maxPriorityFeePerGas).asWei().toGwei(),
              }
            : {};

    return {
        type: 'final',
        fee,
        feePerByte,
        feeLimit: gasLimit,
        totalSpent: fee,
        bytes: 0,
        inputs: [],
        outputs: [],
        outputsPermutation: [],
        ...eip1559Fields,
    };
};

export const buildYieldDepositFeePreview = (
    unsignedTransaction: string,
): PrecomposedTransactionFinal | null => {
    const tx = parseUnsignedEvmTransactionForSigning(unsignedTransaction);

    if (!tx) {
        return null;
    }

    return buildPrecomposedTransaction(tx);
};
