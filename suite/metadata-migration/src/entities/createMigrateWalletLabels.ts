import { type UpdateWalletLabelDep } from '@suite-common/suite-sync-types';
import type { WalletDescriptor } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';
import type { Result } from '@trezor/type-utils';

import type {
    GetCurrentWalletLabel,
    GetLegacyWalletLabels,
    MigrationCounts,
    MigrationError,
} from '../legacyLabelsMigration';
import { normalizeLabel } from '../migrationUtils';

export type MigrateWalletLabelsDeps = {
    getLegacyWalletLabels: GetLegacyWalletLabels;
    getCurrentWalletLabel: GetCurrentWalletLabel;
} & UpdateWalletLabelDep;

export type MigrateWalletLabelsParams = {
    deviceStaticSessionId: StaticSessionId;
    walletDescriptor: WalletDescriptor;
};

export type MigrateWalletLabels = (
    params: MigrateWalletLabelsParams,
) => Promise<Result<MigrationCounts, MigrationError>>;

export type MigrateWalletLabelsDep = {
    migrateWalletLabels: MigrateWalletLabels;
};

export const createMigrateWalletLabels =
    (deps: MigrateWalletLabelsDeps): MigrateWalletLabels =>
    async ({ deviceStaticSessionId, walletDescriptor }) => {
        const legacyWalletLabel = normalizeLabel(
            deps.getLegacyWalletLabels(deviceStaticSessionId).walletLabel,
        );

        if (legacyWalletLabel === null) {
            return ok({ changed: 0, skipped: 0 });
        }

        const currentWalletLabel = deps.getCurrentWalletLabel(walletDescriptor);

        if (currentWalletLabel !== null) {
            return ok({ changed: 0, skipped: 1 });
        }

        const updateWalletLabelResult = await deps.updateWalletLabel({
            deviceStaticSessionId,
            label: legacyWalletLabel,
        });

        if (!updateWalletLabelResult.success) {
            return err({
                type: 'update-failed' as const,
                entity: 'wallet' as const,
                deviceStaticSessionId,
                cause: updateWalletLabelResult.error,
            });
        }

        return ok({ changed: 1, skipped: 0 });
    };
