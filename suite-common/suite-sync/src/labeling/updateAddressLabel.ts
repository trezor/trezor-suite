import { SuiteSyncStorageRepositoryDep, UpdateAddressLabel } from '@suite-common/suite-sync-types';
import { SuiteSyncOwner } from '@suite-common/suite-types';
import { StaticSessionId } from '@trezor/connect';

export type UpdateAddressLabelDeps = {
    findSuiteSyncOwnerForDeviceStaticId: (staticId: StaticSessionId) => SuiteSyncOwner | null;
} & SuiteSyncStorageRepositoryDep;

export const createUpdateAddressLabel =
    (deps: UpdateAddressLabelDeps): UpdateAddressLabel =>
    ({ deviceStaticSessionId, address, label, accountDescriptor, networkSymbol }) => {
        const owner = deps.findSuiteSyncOwnerForDeviceStaticId(deviceStaticSessionId);

        if (owner === null) {
            console.error(
                'Evolu: [UpdateAddressLabel] no keys found on the selected device',
                deviceStaticSessionId,
            );

            return;
        }

        deps.suiteSyncStorageRepository
            .get(owner)
            .addressLabels.update({ address, label, accountDescriptor, networkSymbol });
    };
