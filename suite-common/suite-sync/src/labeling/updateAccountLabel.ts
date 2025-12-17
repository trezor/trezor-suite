import { UpdateAccountLabel } from '@suite-common/suite-sync-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { ok } from '@trezor/type-utils';

import { EnsureStorageDep } from '../storage/createEnsureStorage';

export type UpdateAccountLabelDeps = EnsureStorageDep;

export const createUpdateAccountLabel =
    (deps: UpdateAccountLabelDeps): UpdateAccountLabel =>
    async ({ deviceStaticSessionId, accountKey, label }) => {
        const storageResult = await deps.ensureStorage({ deviceStaticSessionId });

        if (!storageResult.ok) {
            return storageResult;
        }

        const { accountDescriptor, networkSymbol } = parseAccountKey(accountKey);

        storageResult.value.accountLabels.update({ accountDescriptor, networkSymbol, label });

        return ok();
    };
