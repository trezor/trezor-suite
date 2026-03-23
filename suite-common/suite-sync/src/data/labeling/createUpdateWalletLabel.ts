import {
    type EnsureWalletSuiteSyncOnDep,
    type UpdateWalletLabel,
} from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

export type UpdateWalletLabelDeps = EnsureWalletSuiteSyncOnDep;

export const createUpdateWalletLabel =
    (deps: UpdateWalletLabelDeps): UpdateWalletLabel =>
    async ({ deviceStaticSessionId, label }) => {
        const ensureWalletOnResult = await deps.ensureWalletSuiteSyncOn({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        if (!ensureWalletOnResult.success) {
            return ensureWalletOnResult;
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        return ensureWalletOnResult.payload.data.wallets.update({ walletDescriptor, label });
    };
