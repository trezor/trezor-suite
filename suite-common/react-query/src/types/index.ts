import type { MutationKey, QueryKey } from '@tanstack/react-query';

type AllQueryKey = QueryKey | QueryKey[];

export type AllowedQueryKey = AllQueryKey | ((...args: any[]) => AllQueryKey);

type AllMutationKey = MutationKey | MutationKey[];

export type AllowedMutationKey = AllMutationKey | ((...args: any[]) => AllMutationKey);
