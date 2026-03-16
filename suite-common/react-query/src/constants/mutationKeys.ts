import { type AllowedMutationKey } from '../types';

export const commonMutationKeys = {} as const satisfies Record<string, AllowedMutationKey>;

export const desktopMutationKeys = {
    getYieldOpportunities: ['get-yield-opportunities'],
    enterYieldOpportunity: ['enter-yield-opportunity'],
    submitTxHash: ['submit-tx-hash'],
    exitYieldOpportunity: ['exit-yield-opportunity'],
} as const satisfies Record<string, AllowedMutationKey>;

export const mobileMutationKeys = {} as const satisfies Record<string, AllowedMutationKey>;
