import { UpdateWalletLabel } from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import { EnsureStorageDep } from '../../storage/createEnsureStorage';

export type UpdateWalletLabelDeps = EnsureStorageDep;

export const createUpdateWalletLabel =
    (deps: UpdateWalletLabelDeps): UpdateWalletLabel =>
    async ({ deviceStaticSessionId, label }) => {
        const storageResult = await deps.ensureStorage({ deviceStaticSessionId });

        if (!storageResult.ok) {
            return storageResult;
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        return storageResult.value.data.wallets.update({ walletDescriptor, label });
    };
