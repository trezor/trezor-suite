import type { AccountLabels } from '@suite-common/metadata-types';
import type { AllLabelsForAccount } from '@suite-common/suite-sync';
import { type UpdateAccountLabelDep } from '@suite-common/suite-sync-types';
import type { Account } from '@suite-common/wallet-types';
import { err, ok } from '@trezor/type-utils';
import type { Result } from '@trezor/type-utils';

import type { MigrationCounts, MigrationError } from '../legacyLabelsMigration';
import { normalizeLabel } from '../migrationUtils';

export type MigrateAccountLabelsDeps = UpdateAccountLabelDep;

export type MigrateAccountLabelsParams = {
    account: Account;
    legacyAccountLabels: AccountLabels;
    currentAccountLabels: AllLabelsForAccount;
};

export type MigrateAccountLabels = (
    params: MigrateAccountLabelsParams,
) => Promise<Result<MigrationCounts, MigrationError>>;

export type MigrateAccountLabelsDep = {
    migrateAccountLabels: MigrateAccountLabels;
};

export const createMigrateAccountLabels =
    (deps: MigrateAccountLabelsDeps): MigrateAccountLabels =>
    async ({ account, legacyAccountLabels, currentAccountLabels }) => {
        const legacyAccountLabel = normalizeLabel(legacyAccountLabels.accountLabel);

        if (legacyAccountLabel === null) {
            return ok({ changed: 0, skipped: 0 });
        }

        if (currentAccountLabels.accountLabel !== null) {
            return ok({ changed: 0, skipped: 1 });
        }

        const updateAccountLabelResult = await deps.updateAccountLabel({
            deviceStaticSessionId: account.deviceState,
            accountKey: account.key,
            label: legacyAccountLabel,
        });

        if (!updateAccountLabelResult.success) {
            return err({
                type: 'update-failed' as const,
                entity: 'account' as const,
                deviceStaticSessionId: account.deviceState,
                cause: updateAccountLabelResult.error,
            });
        }

        return ok({ changed: 1, skipped: 0 });
    };
