import { type StaticSessionId } from '@trezor/connect';
import { type Result } from '@trezor/type-utils';

import { type EnsureWalletSuiteSyncOnErrors } from './storage/ensureWalletSuiteSyncOn';

type TurnOnSuiteSyncParams = {
    /**
     * You can optionally provide deviceStaticSessionId for which
     * the `ensureWalletSuiteSyncOn` will be called (keys, quota-manager, ...)
     *
     * It is optional for context where you do not have selected device.
     */
    deviceStaticSessionId: StaticSessionId | undefined;
};

export type TurnOnSuiteSync = (
    params: TurnOnSuiteSyncParams,
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors>>;

export type TurnOnSuiteSyncDep = { turnOnSuiteSync: TurnOnSuiteSync };
