import { type Dispatch } from '@reduxjs/toolkit';

import { metadataActions } from '@suite/metadata';
import { suiteSyncErrorHandler } from '@suite/suite-sync';
import { isTrezorDeviceWithState } from '@suite-common/device';
import { type MetadataProvider } from '@suite-common/metadata-types';
import { type WalletSuiteSyncOnEnsuredListener } from '@suite-common/suite-sync-types';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type WalletDescriptor } from '@suite-common/wallet';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';

import type { MigrateLegacyLabelsToSuiteSync } from './migrateLegacyLabelsToSuiteSync';

type CreateEnsureWalletSuiteSyncOnWithMigrationDeps = {
    dispatch: Dispatch;
    migrateLegacyLabelsToSuiteSync: MigrateLegacyLabelsToSuiteSync;
    getIsMetadataEnabled: () => boolean;
    getSelectedProviderForLabels: () => MetadataProvider | undefined;
    getHasLegacyLabelsMigrated: (walletDescriptor: WalletDescriptor) => boolean;
    getDeviceByStaticSessionId: (
        deviceStaticSessionId: StaticSessionId,
    ) => TrezorDevice | undefined;
};

export const createMigrateLabelsIfAvailable = (
    deps: CreateEnsureWalletSuiteSyncOnWithMigrationDeps,
): WalletSuiteSyncOnEnsuredListener => {
    let isMigrating = false;

    return async ({ deviceStaticSessionId }) => {
        if (isMigrating) {
            return;
        }

        const device = deps.getDeviceByStaticSessionId(deviceStaticSessionId);

        if (!isTrezorDeviceWithState(device)) {
            return;
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        if (
            !deps.getIsMetadataEnabled() ||
            deps.getHasLegacyLabelsMigrated(walletDescriptor) ||
            !deps.getSelectedProviderForLabels()
        ) {
            return;
        }

        isMigrating = true;

        const migrationResult = await deps.migrateLegacyLabelsToSuiteSync(device);

        isMigrating = false;

        if (!migrationResult.success) {
            suiteSyncErrorHandler({
                error: migrationResult.error.cause,
                dispatch: deps.dispatch,
                deviceStaticSessionId,
            });

            return;
        }

        deps.dispatch(metadataActions.setLegacyLabelsMigrationForWallet(walletDescriptor));

        if (migrationResult.payload.changed > 0) {
            deps.dispatch(
                notificationsActions.addToast({
                    type: 'legacy-labeling-migration-success',
                    added: migrationResult.payload.changed,
                    skipped: migrationResult.payload.skipped,
                }),
            );
        }
    };
};
