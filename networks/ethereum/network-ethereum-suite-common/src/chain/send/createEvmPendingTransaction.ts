import type { Transaction } from '@trezor/blockchain-link-types';
import {
    type CreatePendingTransactionParams,
    buildPendingTransaction,
} from '@trezor/network-module-suite-common-types';

import { fromGwei } from './evm/ethConverter';

/**
 * The EVM transaction just broadcast, as the history shows it until the backend lists it. It
 * keeps the nonce it was signed with, which the network's next nonce walks past.
 */
export const createEvmPendingTransaction = (
    params: CreatePendingTransactionParams,
): Transaction => {
    const transaction = buildPendingTransaction(params);
    const { precomposed, signed } = params;
    const nonce = signed.nonce === undefined ? NaN : Number(signed.nonce);

    if (!Number.isSafeInteger(nonce)) return transaction;

    // EIP-1559 transactions pay a fee cap instead of a gas price.
    const maxFeePerGas = 'maxFeePerGas' in precomposed ? precomposed.maxFeePerGas : undefined;
    const maxPriorityFeePerGas =
        'maxPriorityFeePerGas' in precomposed ? precomposed.maxPriorityFeePerGas : undefined;

    return {
        ...transaction,
        ethereumSpecific: {
            status: -1,
            nonce,
            gasLimit: parseInt(precomposed.feeLimit ?? '0', 10),
            gasPrice: maxFeePerGas ? undefined : fromGwei(precomposed.feePerByte).toWei(),
            maxFeePerGas: maxFeePerGas ? fromGwei(maxFeePerGas).toWei() : undefined,
            maxPriorityFeePerGas: maxFeePerGas
                ? fromGwei(maxPriorityFeePerGas ?? '0').toWei()
                : undefined,
        },
    };
};
