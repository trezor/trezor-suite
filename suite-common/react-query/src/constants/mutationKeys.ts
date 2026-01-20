import { AllowedMutationKey } from '../types';

export const commonMutationKeys = {} as const satisfies Record<string, AllowedMutationKey>;

export const desktopMutationKeys = {} as const satisfies Record<string, AllowedMutationKey>;

export const mobileMutationKeys = {} as const satisfies Record<string, AllowedMutationKey>;
