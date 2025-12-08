import { UpdateAccountLabel, UpdateOutputLabelDeps } from '@suite-common/suite-sync-types';
import { parseAccountKey } from '@suite-common/wallet-utils';

export const createUpdateAccountLabel =
    (deps: UpdateOutputLabelDeps): UpdateAccountLabel =>
    ({ deviceStaticSessionId, accountKey, label }) => {
        const owner = deps.findSuiteSyncOwnerForDeviceStaticId(deviceStaticSessionId);

        if (owner === null) {
            console.error(
                'Evolu: [UpdateAccountLabel] no keys found on the selected device',
                deviceStaticSessionId,
            );

            return;
        }

        const { accountDescriptor, networkSymbol } = parseAccountKey(accountKey);

        deps.suiteSyncStorageRepository
            .get(owner)
            .accountLabels.update({ accountDescriptor, networkSymbol, label });
    };
