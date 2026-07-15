import { type Dispatch } from '@reduxjs/toolkit';

import { metadataActions } from '@suite/metadata';
import { suiteSyncErrorHandler } from '@suite/suite-sync';
import { isTrezorDeviceWithState } from '@suite-common/device';
import { type MetadataProvider } from '@suite-common/metadata-types';
import { type OnStorageEnsured } from '@suite-common/suite-sync-types';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type StaticSessionId } from '@trezor/connect';
import { type WalletDescriptor, parseStaticSessionId } from '@trezor/device-utils';

import type { MigrateLegacyLabelsToSuiteSync } from './migrateLegacyLabelsToSuiteSync';

export type CreateMigrateLabelsIfAvailableDeps = {
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
    deps: CreateMigrateLabelsIfAvailableDeps,
): OnStorageEnsured => {
    const isMigratingByWalletDescriptor = new Map<WalletDescriptor, true>();

    return async ({ deviceStaticSessionId, storage }) => {
        const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);

        if (isMigratingByWalletDescriptor.has(walletDescriptor)) {
            return;
        }

        const device = deps.getDeviceByStaticSessionId(deviceStaticSessionId);

        if (!isTrezorDeviceWithState(device)) {
            return;
        }

        if (
            !deps.getIsMetadataEnabled() ||
            deps.getHasLegacyLabelsMigrated(walletDescriptor) ||
            !deps.getSelectedProviderForLabels()
        ) {
            return;
        }

        isMigratingByWalletDescriptor.set(walletDescriptor, true);

        const migrationResult = await deps
            .migrateLegacyLabelsToSuiteSync(device, storage)
            .finally(() => {
                isMigratingByWalletDescriptor.delete(walletDescriptor);
            });

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
