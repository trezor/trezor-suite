import { SuiteSyncOwner } from '@suite-common/suite-types';
import type { StaticSessionId } from '@trezor/connect';

import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';

export type UpdateWalletLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    label: string | null;
};

export type UpdateWalletLabel = (params: UpdateWalletLabelParams) => void;

export type UpdateWalletLabelDeps = {
    findSuiteSyncOwnerForDeviceStaticId: (staticId: StaticSessionId) => SuiteSyncOwner | null;
} & SuiteSyncStorageRepositoryDep;

export type UpdateWalletLabelDep = { updateWalletLabel: UpdateWalletLabel };
