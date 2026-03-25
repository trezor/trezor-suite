import type { AccountLabels } from '@suite-common/metadata-types';
import type { AllLabelsForAccount } from '@suite-common/suite-sync';
import { type UpdateOutputLabelDep } from '@suite-common/suite-sync-types';
import type { Account } from '@suite-common/wallet-types';
import { asTxTargetId } from '@suite-common/wallet-types';
import { err, ok } from '@trezor/type-utils';
import type { Result } from '@trezor/type-utils';
import { typedObjectEntries } from '@trezor/utils';

import type { MigrationCounts, MigrationError } from '../legacyLabelsMigration';
import { normalizeLabel } from '../migrationUtils';

export type MigrateOutputLabelsDeps = UpdateOutputLabelDep;

export type MigrateOutputLabelsParams = {
    account: Account;
    legacyAccountLabels: AccountLabels;
    currentAccountLabels: AllLabelsForAccount;
};

export type MigrateOutputLabels = (
    params: MigrateOutputLabelsParams,
) => Promise<Result<MigrationCounts, MigrationError>>;

export type MigrateOutputLabelsDep = {
    migrateOutputLabels: MigrateOutputLabels;
};

export const createMigrateOutputLabels =
    (deps: MigrateOutputLabelsDeps): MigrateOutputLabels =>
    async ({ account, legacyAccountLabels, currentAccountLabels }) => {
        let changed = 0;
        let skipped = 0;

        for (const [txId, outputLabels] of typedObjectEntries(legacyAccountLabels.outputLabels)) {
            for (const [txTargetId, outputLabel] of typedObjectEntries(outputLabels)) {
                const normalizedOutputLabel = normalizeLabel(outputLabel);

                if (normalizedOutputLabel === null) {
                    continue;
                }

                const currentOutputLabel = currentAccountLabels.outputLabels.find(
                    item => item.txId === txId && String(item.txTargetId) === String(txTargetId),
                );

                if (currentOutputLabel?.label !== null && currentOutputLabel !== undefined) {
                    skipped += 1;

                    continue;
                }

                const updateOutputLabelResult = await deps.updateOutputLabel({
                    deviceStaticSessionId: account.deviceState,
                    txId,
                    txTargetId: asTxTargetId(String(txTargetId)),
                    label: normalizedOutputLabel,
                    accountDescriptor: account.descriptor,
                    networkSymbol: account.symbol,
                });

                if (!updateOutputLabelResult.success) {
                    return err({
                        type: 'update-failed' as const,
                        entity: 'output' as const,
                        deviceStaticSessionId: account.deviceState,
                        cause: updateOutputLabelResult.error,
                    });
                }

                changed += 1;
            }
        }

        return ok({ changed, skipped });
    };
