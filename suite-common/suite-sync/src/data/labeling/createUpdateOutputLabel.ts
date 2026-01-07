import { UpdateOutputLabel } from '@suite-common/suite-sync-types';

import { EnsureStorageDep } from '../../storage/createEnsureStorage';

export type UpdateOutputLabelDeps = EnsureStorageDep;

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
        const storageResult = await deps.ensureStorage({ deviceStaticSessionId });

        if (!storageResult.ok) {
            return storageResult;
        }

        return storageResult.value.data.outputs.update({
            txId,
            outputIndex,
            label,
            accountDescriptor,
            networkSymbol,
        });
    };
