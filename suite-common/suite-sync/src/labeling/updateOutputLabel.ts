import { UpdateOutputLabel, UpdateOutputLabelDeps } from '@suite-common/suite-sync-types';

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
