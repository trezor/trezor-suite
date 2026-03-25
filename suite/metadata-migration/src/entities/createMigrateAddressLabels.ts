import type { AccountLabels } from '@suite-common/metadata-types';
import type { AllLabelsForAccount } from '@suite-common/suite-sync';
import { type UpdateAddressLabelDep } from '@suite-common/suite-sync-types';
import type { Account } from '@suite-common/wallet-types';
import { err, ok } from '@trezor/type-utils';
import type { Result } from '@trezor/type-utils';
import { typedObjectEntries } from '@trezor/utils';

import type { MigrationCounts, MigrationError } from '../legacyLabelsMigration';
import { normalizeLabel } from '../migrationUtils';

export type MigrateAddressLabelsDeps = UpdateAddressLabelDep;

export type MigrateAddressLabelsParams = {
    account: Account;
    legacyAccountLabels: AccountLabels;
    currentAccountLabels: AllLabelsForAccount;
};

export type MigrateAddressLabels = (
    params: MigrateAddressLabelsParams,
) => Promise<Result<MigrationCounts, MigrationError>>;

export type MigrateAddressLabelsDep = {
    migrateAddressLabels: MigrateAddressLabels;
};

export const createMigrateAddressLabels =
    (deps: MigrateAddressLabelsDeps): MigrateAddressLabels =>
    async ({ account, legacyAccountLabels, currentAccountLabels }) => {
        let changed = 0;
        let skipped = 0;

        for (const [address, addressLabel] of typedObjectEntries(
            legacyAccountLabels.addressLabels,
        )) {
            const normalizedAddressLabel = normalizeLabel(addressLabel);

            if (normalizedAddressLabel === null) {
                continue;
            }

            const currentAddressLabel = currentAccountLabels.addressLabels.find(
                item => item.address === address,
            );

            if (currentAddressLabel !== undefined && currentAddressLabel.label !== null) {
                skipped += 1;

                continue;
            }

            const updateAddressLabelResult = await deps.updateAddressLabel({
                deviceStaticSessionId: account.deviceState,
                address,
                label: normalizedAddressLabel,
                accountDescriptor: account.descriptor,
                networkSymbol: account.symbol,
            });

            if (!updateAddressLabelResult.success) {
                return err({
                    type: 'update-failed' as const,
                    entity: 'address' as const,
                    deviceStaticSessionId: account.deviceState,
                    cause: updateAddressLabelResult.error,
                });
            }

            changed += 1;
        }

        return ok({ changed, skipped });
    };
