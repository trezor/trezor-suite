import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type AccountKey } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { type Result } from '@trezor/type-utils';

import { type EnsureWalletSuiteSyncOnErrors } from '../storage/ensureWalletSuiteSyncOn';

export type UpdateAccountLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    accountKey: AccountKey;
    label: string | null;
};

export type UpdateAccountLabel = (
    params: UpdateAccountLabelParams,
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>>;

export type UpdateAccountLabelDep = { updateAccountLabel: UpdateAccountLabel };
