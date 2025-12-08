import { UpdateAddressLabel, UpdateAddressLabelDeps } from '@suite-common/suite-sync-types';

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
