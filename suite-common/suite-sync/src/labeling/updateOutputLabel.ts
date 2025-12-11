import { SuiteSyncStorageRepositoryDep, UpdateOutputLabel } from '@suite-common/suite-sync-types';
import { SuiteSyncOwner } from '@suite-common/suite-types';
import { StaticSessionId } from '@trezor/connect';

export type UpdateOutputLabelDeps = {
    findSuiteSyncOwnerForDeviceStaticId: (staticId: StaticSessionId) => SuiteSyncOwner | null;
} & SuiteSyncStorageRepositoryDep;

export const createUpdateOutputLabel =
    (deps: UpdateOutputLabelDeps): UpdateOutputLabel =>
    ({ outputIndex, label, accountDescriptor, txId, networkSymbol, deviceStaticSessionId }) => {
        const owner = deps.findSuiteSyncOwnerForDeviceStaticId(deviceStaticSessionId);

        if (owner === null) {
            console.error(
                'Evolu: [UpdateOutputLabel] no keys found on the selected device',
                deviceStaticSessionId,
            );

            return;
        }

        deps.suiteSyncStorageRepository
            .get(owner)
            .outputLabels.update({ txId, outputIndex, label, accountDescriptor, networkSymbol });
    };
