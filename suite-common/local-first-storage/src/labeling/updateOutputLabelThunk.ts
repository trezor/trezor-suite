import { createThunk } from '@suite-common/redux-utils';
import { selectDevices } from '@suite-common/wallet-core';
import type { StaticSessionId } from '@trezor/connect';

import { LABELING_PREFIX } from './labelingActions';
import { getLocalFirstStorageProvider } from '../storage/sharedObjects';

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

        const evoluKeys = device?.localFirstStorageSecret?.evoluKeys;

        if (evoluKeys === undefined) {
            return;
        }

        const storage = getLocalFirstStorageProvider(evoluKeys);

        storage.outputLabels.update({ txId, outputIndex, label });
    },
);
