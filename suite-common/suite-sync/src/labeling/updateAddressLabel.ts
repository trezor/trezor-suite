import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectDevices } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';

import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';

type UpdateAddressLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    address: string;
    label: string | null;
    accountDescriptor: Account['descriptor'];
    networkSymbol: NetworkSymbol;
};

type UpdateAddressLabel = (params: UpdateAddressLabelParams) => void;

type UpdateAddressLabelDeps = { getState: () => any } & SuiteSyncStorageRepositoryDep;

export type UpdateAddressLabelDep = { updateAddressLabel: UpdateAddressLabel };

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
