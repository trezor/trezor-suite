import { UpdateWalletLabel } from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { ok } from '@trezor/type-utils';

import { EnsureStorageDep } from '../storage/ensureStorage';

export type UpdateWalletLabelDeps = EnsureStorageDep;

export const createUpdateWalletLabel =
    (deps: UpdateWalletLabelDeps): UpdateWalletLabel =>
    async ({ deviceStaticSessionId, label }): ReturnType<UpdateWalletLabel> => {
        const storageResult = await deps.ensureStorage({ deviceStaticSessionId });

        if (!storageResult.ok) {
            return storageResult;
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        storageResult.value.walletLabels.update({ walletDescriptor, label });

        return ok();
    };
