import type { FormOptions, FormState } from '@suite-common/wallet-types';

/**
 * Where each send option keeps its state in the send form. The names predate the options and
 * still carry the network that introduced them; renaming them needs a migration of saved send
 * drafts, so only this module knows them.
 */
export const sendOptionFields = {
    memo: { option: 'destinationTag', value: 'destinationTag' },
    data: { option: 'transactionData', value: 'transactionData' },
    nonce: { option: 'ethereumNonce', value: 'ethereumNonce' },
    locktime: { option: 'bitcoinLocktime' },
    coinSelection: { option: 'utxoSelection' },
    broadcast: { option: 'broadcast' },
} as const satisfies Record<
    string,
    { readonly option: FormOptions; readonly value?: keyof FormState }
>;
