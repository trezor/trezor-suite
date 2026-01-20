import { AllowedMutationKey } from '../types';

export const commonMutationKeys = {} as const satisfies Record<string, AllowedMutationKey>;

export const desktopMutationKeys = {
    getInactiveTokens: (symbol: string) => ['get-inactive-tokens', symbol],
} as const satisfies Record<string, AllowedMutationKey>;

export const mobileMutationKeys = {} as const satisfies Record<string, AllowedMutationKey>;
