import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateOutputLabel,
    type WriteOutputLabelDep,
} from '@suite-common/suite-sync-types';

export type UpdateOutputLabelDeps = EnsureWalletSuiteSyncOnDep & WriteOutputLabelDep;

export const createUpdateOutputLabel =
    (deps: UpdateOutputLabelDeps): UpdateOutputLabel =>
    async data => {
        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId: data.deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        return deps.writeOutputLabel({ storage: ensureWalletOnResult.payload, data });
    };
