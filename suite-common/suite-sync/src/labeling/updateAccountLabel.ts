import { UpdateAccountLabel, UpdateOutputLabelDeps } from '@suite-common/suite-sync-types';
import { selectDevices } from '@suite-common/wallet-core';
import { parseAccountKey } from '@suite-common/wallet-utils';

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
