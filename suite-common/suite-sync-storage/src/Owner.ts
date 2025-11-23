import { SuiteSyncOwner } from '@suite-common/suite-types';
import { Result } from '@trezor/type-utils';

type CreateSuiteSyncOwnerError = { type: 'CreateSuiteSyncOwnerError'; message: string };

export type CreateSuiteSyncOwner = (params: {
    data: string;
}) => Result<SuiteSyncOwner, CreateSuiteSyncOwnerError>;
