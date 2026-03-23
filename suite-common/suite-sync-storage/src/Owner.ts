import { type Result } from '@trezor/type-utils';

import type { SuiteSyncOwner } from './owner/suiteSyncOwner';

export type CreateSuiteSyncOwnerError = { type: 'CreateSuiteSyncOwnerError'; message: string };

export const CreateSuiteSyncOwnerError = (message: string): CreateSuiteSyncOwnerError => ({
    type: 'CreateSuiteSyncOwnerError' as const,
    message,
});

export type CreateSuiteSyncOwner = (params: {
    data: string;
}) => Result<SuiteSyncOwner, CreateSuiteSyncOwnerError>;

export type CreateSuiteSyncOwnerDep = { createSuiteSyncOwner: CreateSuiteSyncOwner };
