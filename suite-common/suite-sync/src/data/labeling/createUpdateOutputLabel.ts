import { UpdateOutputLabel } from '@suite-common/suite-sync-types';
import { EnsureWalletSuiteSyncOnDep } from '@suite-common/suite-sync-types/src/storage/ensureWalletSuiteSyncOn';

export type UpdateOutputLabelDeps = EnsureWalletSuiteSyncOnDep;

export const createUpdateOutputLabel =
    (deps: UpdateOutputLabelDeps): UpdateOutputLabel =>
    async ({
        outputIndex,
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
            outputIndex,
            label,
            accountDescriptor,
            networkSymbol,
        });
    };
