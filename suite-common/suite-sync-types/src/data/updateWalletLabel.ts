import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import type { StaticSessionId } from '@trezor/connect';
import { type Result } from '@trezor/type-utils';

import { type WithSuiteSyncStorage } from './withSuiteSyncStorage';
import { type EnsureWalletSuiteSyncOnErrors } from '../storage/ensureWalletSuiteSyncOn';

export type UpdateWalletLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    label: string | null;
};

export type UpdateWalletLabel = (
    params: UpdateWalletLabelParams,
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>>;

export type UpdateWalletLabelDep = { updateWalletLabel: UpdateWalletLabel };

export const selectUpdateWalletLabelDep = (services: any): UpdateWalletLabelDep => ({
    updateWalletLabel: services.suiteSync.labeling.updateWalletLabel,
});

export type WriteWalletLabelParams = WithSuiteSyncStorage<UpdateWalletLabelParams>;

export type WriteWalletLabel = (
    params: WriteWalletLabelParams,
) => Result<void, SuiteSyncUpdateError>;

export type WriteWalletLabelDep = { writeWalletLabel: WriteWalletLabel };
