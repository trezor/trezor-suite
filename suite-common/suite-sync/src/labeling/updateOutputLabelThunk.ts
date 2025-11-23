import { createThunk } from '@suite-common/redux-utils';
import { getLocalFirstStorageProvider } from '@suite-common/suite-sync-storage';
import { selectDevices } from '@suite-common/wallet-core';
import type { StaticSessionId } from '@trezor/connect';

import { LABELING_PREFIX } from './labelingActions';

type UpdateOutputLabelThunkParams = {
    deviceStaticSessionId: StaticSessionId;
    txId: string;
    outputIndex: number;
    label: string | null;
};

export const updateOutputLabelThunk = createThunk<void, UpdateOutputLabelThunkParams, void>(
    `${LABELING_PREFIX}/updateOutputLabelThunk`,
    ({ deviceStaticSessionId, txId, outputIndex, label }, { getState }) => {
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

        const storage = getLocalFirstStorageProvider(owner);

        storage.outputLabels.update({ txId, outputIndex, label });
    },
);
