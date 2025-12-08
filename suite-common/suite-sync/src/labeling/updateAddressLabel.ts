import { UpdateAddressLabel, UpdateAddressLabelDeps } from '@suite-common/suite-sync-types';
import { selectDevices } from '@suite-common/wallet-core';

export const createUpdateAddressLabel =
    (deps: UpdateAddressLabelDeps): UpdateAddressLabel =>
    ({ deviceStaticSessionId, address, label, accountDescriptor, networkSymbol }) => {
        const device = selectDevices(deps.getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const owner = device?.suiteSyncOwner;

        if (owner === undefined) {
            console.error(
                'Evolu: [updateAddressLabelThunk] no keys found on the selected device',
                deviceStaticSessionId,
            );

            return;
        }

        deps.suiteSyncStorageRepository
            .get(owner)
            .addressLabels.update({ address, label, accountDescriptor, networkSymbol });
    };
