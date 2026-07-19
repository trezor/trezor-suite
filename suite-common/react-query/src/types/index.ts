import type { QueryKey } from '@tanstack/react-query';

type AllQueryKey = QueryKey | QueryKey[];

export type AllowedQueryKey = AllQueryKey | ((...args: any[]) => AllQueryKey);
