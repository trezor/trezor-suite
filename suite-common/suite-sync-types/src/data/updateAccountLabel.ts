import { SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import type { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { EnsureWalletSuiteSyncOnErrors } from '../storage/ensureWalletSuiteSyncOn';

export type UpdateAccountLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    accountKey: string;
    label: string | null;
};

export type UpdateAccountLabel = (
    params: UpdateAccountLabelParams,
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>>;

export type UpdateAccountLabelDep = { updateAccountLabel: UpdateAccountLabel };
