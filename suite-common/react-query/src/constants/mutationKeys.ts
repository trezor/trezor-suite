import { type AllowedMutationKey } from '../types';

export const desktopMutationKeys = {
    getYieldOpportunities: ['get-yield-opportunities'],
} as const satisfies Record<string, AllowedMutationKey>;
