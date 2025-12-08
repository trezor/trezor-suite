import { UpdateOutputLabel, UpdateOutputLabelDeps } from '@suite-common/suite-sync-types';
import { selectDevices } from '@suite-common/wallet-core';

export const createUpdateOutputLabel =
    (deps: UpdateOutputLabelDeps): UpdateOutputLabel =>
    ({ outputIndex, label, accountDescriptor, txId, networkSymbol, deviceStaticSessionId }) => {
        const device = selectDevices(deps.getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const owner = device?.suiteSyncOwner;

        if (owner === undefined) {
            console.error(
                'Evolu: [updateOutputLabelThunk] no keys found on the selected device',
                deviceStaticSessionId,
            );

            return;
        }

        deps.suiteSyncStorageRepository
            .get(owner)
            .outputLabels.update({ txId, outputIndex, label, accountDescriptor, networkSymbol });
    };
