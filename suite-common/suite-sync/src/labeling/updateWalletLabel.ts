import { selectDevices } from '@suite-common/wallet-core/src/device/deviceSelectors';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import type { StaticSessionId } from '@trezor/connect';

import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';

type UpdateWalletLabelDeps = { getState: () => any } & SuiteSyncStorageRepositoryDep;

type UpdateWalletLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    label: string | null;
};

type UpdateWalletLabel = (params: UpdateWalletLabelParams) => void;

export type UpdateWalletLabelDep = { updateWalletLabel: UpdateWalletLabel };

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
