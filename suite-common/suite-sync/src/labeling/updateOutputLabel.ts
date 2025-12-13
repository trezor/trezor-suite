import { UpdateOutputLabel } from '@suite-common/suite-sync-types';
import { ok } from '@trezor/type-utils';

import { EnsureStorageDep } from '../storage/ensureStorage';

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

        storageResult.value.outputLabels.update({
            txId,
            outputIndex,
            label,
            accountDescriptor,
            networkSymbol,
        });

        return ok();
    };
