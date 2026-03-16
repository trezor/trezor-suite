import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateOutputLabel,
} from '@suite-common/suite-sync-types';

export type UpdateOutputLabelDeps = EnsureWalletSuiteSyncOnDep;

export const createUpdateOutputLabel =
    (deps: UpdateOutputLabelDeps): UpdateOutputLabel =>
    async ({
        txTargetId,
        label,
        accountDescriptor,
        txId,
        networkSymbol,
        deviceStaticSessionId,
    }) => {
        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        return ensureWalletOnResult.payload.data.outputs.update({
            txId,
            txTargetId,
            label,
            accountDescriptor,
            networkSymbol,
        });
    };
