import type { StaticSessionId } from '@trezor/connect';

import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';

export type UpdateWalletLabelDeps = { getState: () => any } & SuiteSyncStorageRepositoryDep;

export type UpdateWalletLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    label: string | null;
};

export type UpdateWalletLabel = (params: UpdateWalletLabelParams) => void;

export type UpdateWalletLabelDep = { updateWalletLabel: UpdateWalletLabel };
