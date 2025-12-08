import { SuiteSyncOwner } from '@suite-common/suite-types';
import type { StaticSessionId } from '@trezor/connect';

import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';

export type UpdateAccountLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    accountKey: string;
    label: string | null;
};

export type UpdateAccountLabel = (params: UpdateAccountLabelParams) => void;

export type UpdateAccountLabelDeps = {
    findSuiteSyncOwnerForDeviceStaticId: (staticId: StaticSessionId) => SuiteSyncOwner | null;
} & SuiteSyncStorageRepositoryDep;

export type UpdateAccountLabelDep = { updateAccountLabel: UpdateAccountLabel };
