import { type AllowedMutationKey } from '../types';

export const desktopMutationKeys = {} as const satisfies Record<string, AllowedMutationKey>;

/** Sending on a chain; the variables carry the account and the transaction, so they are confidential. */
export const chainMutationKeys = {
    sign: ['chain', 'sign'],
    push: ['chain', 'push'],
} as const satisfies Record<string, AllowedMutationKey>;
