import { UpdateWalletLabel } from '@suite-common/suite-sync-types';
import { EnsureWalletSuiteSyncOnDep } from '@suite-common/suite-sync-types/src/storage/ensureWalletSuiteSyncOn';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

export type UpdateWalletLabelDeps = EnsureWalletSuiteSyncOnDep;

export const createUpdateWalletLabel =
    (deps: UpdateWalletLabelDeps): UpdateWalletLabel =>
    async ({ deviceStaticSessionId, label }) => {
        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        return ensureWalletOnResult.payload.data.wallets.update({ walletDescriptor, label });
    };
