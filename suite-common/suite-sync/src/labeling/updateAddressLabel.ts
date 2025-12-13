import { UpdateAddressLabel } from '@suite-common/suite-sync-types';
import { ok } from '@trezor/type-utils';

import { EnsureStorageDep } from '../storage/ensureStorage';

export type UpdateAddressLabelDeps = EnsureStorageDep;

export const createUpdateAddressLabel =
    (deps: UpdateAddressLabelDeps): UpdateAddressLabel =>
    async ({ deviceStaticSessionId, address, label, accountDescriptor, networkSymbol }) => {
        const storageResult = await deps.ensureStorage({ deviceStaticSessionId });

        if (!storageResult.ok) {
            return storageResult;
        }

        storageResult.value.addressLabels.update({
            address,
            label,
            accountDescriptor,
            networkSymbol,
        });

        return ok();
    };
