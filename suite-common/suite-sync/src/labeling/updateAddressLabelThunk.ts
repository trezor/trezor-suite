import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectDevices } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';

import { LABELING_PREFIX } from './labelingActions';

type UpdateAddressLabelThunkParams = {
    deviceStaticSessionId: StaticSessionId;
    address: string;
    label: string | null;
    accountDescriptor: Account['descriptor'];
    networkSymbol: NetworkSymbol;
};

export const updateAddressLabelThunk = createThunk<void, UpdateAddressLabelThunkParams, void>(
    `${LABELING_PREFIX}/updateAddressLabelThunk`,
    (
        { deviceStaticSessionId, address, label, accountDescriptor, networkSymbol },
        { getState, extra: { services } },
    ) => {
        const device = selectDevices(getState())?.find(
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

        services.suiteSync.suiteSyncStorageRepository
            .get(owner)
            .addressLabels.update({ address, label, accountDescriptor, networkSymbol });
    },
);
