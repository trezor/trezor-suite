import { selectDevices } from '@suite-common/wallet-core';
import { parseAccountKey } from '@suite-common/wallet-utils';

import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';

type UpdateAccountLabelParams = {
    deviceStaticSessionId: string;
    accountKey: string;
    label: string | null;
};

type UpdateAccountLabel = (params: UpdateAccountLabelParams) => void;

type UpdateOutputLabelDeps = { getState: () => any } & SuiteSyncStorageRepositoryDep;

export type UpdateAccountLabelDep = { updateAccountLabel: UpdateAccountLabel };

export const createUpdateAccountLabel =
    (deps: UpdateOutputLabelDeps): UpdateAccountLabel =>
    ({ deviceStaticSessionId, accountKey, label }) => {
        const device = selectDevices(deps.getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const owner = device?.suiteSyncOwner;

        if (owner === undefined) {
            console.error(
                'Evolu: [updateAccountLabelThunk] no keys found on the selected device',
                deviceStaticSessionId,
            );

            return;
        }

        const { accountDescriptor, networkSymbol } = parseAccountKey(accountKey);

        deps.suiteSyncStorageRepository
            .get(owner)
            .accountLabels.update({ accountDescriptor, networkSymbol, label });
    };
