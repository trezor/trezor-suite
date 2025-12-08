import { UpdateWalletLabel, UpdateWalletLabelDeps } from '@suite-common/suite-sync-types';
import { selectDevices } from '@suite-common/wallet-core';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

export const createUpdateWalletLabel =
    (deps: UpdateWalletLabelDeps): UpdateWalletLabel =>
    ({ deviceStaticSessionId, label }) => {
        const device = selectDevices(deps.getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const owner = device?.suiteSyncOwner;

        if (owner === undefined) {
            console.error(
                'Evolu: [updateWalletLabelThunk] no keys found on the selected device',
                deviceStaticSessionId,
            );

            return;
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        deps.suiteSyncStorageRepository.get(owner).walletLabels.update({ walletDescriptor, label });
    };
