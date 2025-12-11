import { SuiteSyncStorageRepositoryDep, UpdateWalletLabel } from '@suite-common/suite-sync-types';
import { SuiteSyncOwner } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';

export type UpdateWalletLabelDeps = {
    findSuiteSyncOwnerForDeviceStaticId: (staticId: StaticSessionId) => SuiteSyncOwner | null;
} & SuiteSyncStorageRepositoryDep;

export const createUpdateWalletLabel =
    (deps: UpdateWalletLabelDeps): UpdateWalletLabel =>
    ({ deviceStaticSessionId, label }) => {
        const owner = deps.findSuiteSyncOwnerForDeviceStaticId(deviceStaticSessionId);

        if (owner === null) {
            console.error(
                'Evolu: [UpdateWalletLabel] no keys found on the selected device',
                deviceStaticSessionId,
            );

            return;
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        deps.suiteSyncStorageRepository.get(owner).walletLabels.update({ walletDescriptor, label });
    };
