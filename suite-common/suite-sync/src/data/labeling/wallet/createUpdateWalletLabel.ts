import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateWalletLabel,
    type WriteWalletLabelDep,
} from '@suite-common/suite-sync-types';

export type UpdateWalletLabelDeps = EnsureWalletSuiteSyncOnDep & WriteWalletLabelDep;

export const createUpdateWalletLabel =
    (deps: UpdateWalletLabelDeps): UpdateWalletLabel =>
    async data => {
        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId: data.deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        return deps.writeWalletLabel({ storage: ensureWalletOnResult.payload, data });
    };
