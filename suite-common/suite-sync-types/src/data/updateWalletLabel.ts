import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import type { StaticSessionId } from '@trezor/connect';
import { type Result } from '@trezor/type-utils';

import { type EnsureWalletSuiteSyncOnErrors } from '../storage/ensureWalletSuiteSyncOn';

export type UpdateWalletLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    label: string | null;
};

export type UpdateWalletLabel = (
    params: UpdateWalletLabelParams,
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>>;

export type UpdateWalletLabelDep = { updateWalletLabel: UpdateWalletLabel };
