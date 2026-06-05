import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateAccountLabel,
    type WriteAccountLabelDep,
} from '@suite-common/suite-sync-types';

export type UpdateAccountLabelDeps = EnsureWalletSuiteSyncOnDep & WriteAccountLabelDep;

export const createUpdateAccountLabel =
    (deps: UpdateAccountLabelDeps): UpdateAccountLabel =>
    async data => {
        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId: data.deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        return deps.writeAccountLabel({ storage: ensureWalletOnResult.payload, data });
    };
