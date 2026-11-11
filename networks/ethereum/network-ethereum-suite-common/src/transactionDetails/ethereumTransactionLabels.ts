import type { Label } from '@trezor/network-module-suite-common-types';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const ethereumTransactionLabels = {
    nonce: { id: 'TR_NONCE', defaultMessage: 'Nonce' },
    gasLimit: { id: 'TR_GAS_LIMIT', defaultMessage: 'Gas limit' },
    gasLimitAndUsage: { id: 'TR_GAS_LIMIT_AND_USAGE', defaultMessage: 'Gas limit & usage' },
    gasPrice: { id: 'TR_GAS_PRICE', defaultMessage: 'Gas price' },
    maxFeePerGas: { id: 'TR_MAX_FEE_PER_GAS', defaultMessage: 'Max fee per gas' },
    baseFeePerGas: { id: 'TR_BLOCK_BASE_FEE', defaultMessage: 'Block base fee' },
    maxPriorityFeePerGas: { id: 'TR_MAX_PRIORITY_FEE_PER_GAS', defaultMessage: 'Max priority fee' },
} as const satisfies Record<string, Label>;
