import { UpdateAddressLabel } from '@suite-common/suite-sync-types';

import { EnsureStorageDep } from '../../storage/createEnsureStorage';

export type UpdateAddressLabelDeps = EnsureStorageDep;

export const createUpdateAddressLabel =
    (deps: UpdateAddressLabelDeps): UpdateAddressLabel =>
    async ({ deviceStaticSessionId, address, label, accountDescriptor, networkSymbol }) => {
        const storageResult = await deps.ensureStorage({ deviceStaticSessionId });

        if (!storageResult.ok) {
            return storageResult;
        }

        return storageResult.value.data.addresses.update({
            address,
            label,
            accountDescriptor,
            networkSymbol,
        });
    };
