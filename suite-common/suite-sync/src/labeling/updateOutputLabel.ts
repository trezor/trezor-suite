import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectDevices } from '@suite-common/wallet-core/src/device/deviceSelectors';
import type { StaticSessionId } from '@trezor/connect';

import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';

type UpdateOutputLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    txId: string;
    outputIndex: number;
    label: string | null;
    accountDescriptor: string;
    networkSymbol: NetworkSymbol;
};

type UpdateOutputLabelDeps = { getState: () => any } & SuiteSyncStorageRepositoryDep;

type UpdateOutputLabel = (params: UpdateOutputLabelParams) => void;

export type UpdateOutputLabelDep = { updateOutputLabel: UpdateOutputLabel };

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
