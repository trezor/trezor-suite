import { createThunk } from '@suite-common/redux-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectDevices } from '@suite-common/wallet-core';
import type { StaticSessionId } from '@trezor/connect';

import { LABELING_PREFIX } from './labelingActions';

type UpdateOutputLabelThunkParams = {
    deviceStaticSessionId: StaticSessionId;
    txId: string;
    outputIndex: number;
    label: string | null;
    accountDescriptor: string;
    networkSymbol: NetworkSymbol;
};

export const updateOutputLabelThunk = createThunk<void, UpdateOutputLabelThunkParams, void>(
    `${LABELING_PREFIX}/updateOutputLabelThunk`,
    (
        { deviceStaticSessionId, txId, outputIndex, label, accountDescriptor, networkSymbol },
        { getState, extra: { services } },
    ) => {
        console.log('updateOutputLabelThunk');
        const device = selectDevices(getState())?.find(
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

        services.suiteSync.suiteSyncStorageRepository
            .get(owner)
            .outputLabels.update({ txId, outputIndex, label, accountDescriptor, networkSymbol });
    },
);
