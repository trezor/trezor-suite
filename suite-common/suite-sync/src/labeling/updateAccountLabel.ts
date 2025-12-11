import { SuiteSyncStorageRepositoryDep, UpdateAccountLabel } from '@suite-common/suite-sync-types';
import { SuiteSyncOwner } from '@suite-common/suite-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';

export type UpdateAccountLabelDeps = {
    findSuiteSyncOwnerForDeviceStaticId: (staticId: StaticSessionId) => SuiteSyncOwner | null;
} & SuiteSyncStorageRepositoryDep;

export const createUpdateAccountLabel =
    (deps: UpdateAccountLabelDeps): UpdateAccountLabel =>
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
