import { type Result } from '@trezor/type-utils';

import type { SuiteSyncOwner } from './owner/suiteSyncOwner';

export type CreateSuiteSyncOwnerError = { type: 'CreateSuiteSyncOwnerError'; message: string };

export const CreateSuiteSyncOwnerError = (message: string): CreateSuiteSyncOwnerError => ({
    type: 'CreateSuiteSyncOwnerError' as const,
    message,
});

type CreateSuiteSyncOwnerResult = Result<SuiteSyncOwner, CreateSuiteSyncOwnerError>;

/**
 * May resolve asynchronously, so an implementation can load its library on demand.
 */
export type CreateSuiteSyncOwner = (params: {
    data: string;
}) => CreateSuiteSyncOwnerResult | Promise<CreateSuiteSyncOwnerResult>;

export type CreateSuiteSyncOwnerDep = { createSuiteSyncOwner: CreateSuiteSyncOwner };
