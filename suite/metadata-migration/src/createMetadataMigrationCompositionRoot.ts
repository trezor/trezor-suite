import {
    type UpdateAccountLabelDep,
    type UpdateAddressLabelDep,
    type UpdateOutputLabelDep,
    type UpdateWalletLabelDep,
} from '@suite-common/suite-sync-types';

import { createMigrateAccountLabels } from './entities/createMigrateAccountLabels';
import { createMigrateAddressLabels } from './entities/createMigrateAddressLabels';
import { createMigrateOutputLabels } from './entities/createMigrateOutputLabels';
import { createMigrateWalletLabels } from './entities/createMigrateWalletLabels';
import type {
    GetAccountsByDeviceState,
    GetCurrentAccountLabels,
    GetCurrentWalletLabel,
    GetLegacyAccountLabels,
    GetLegacyWalletLabels,
} from './legacyLabelsMigration';
import {
    type MigrateLegacyLabelsToSuiteSync,
    createMigrateLegacyLabelsToSuiteSync,
} from './migrateLegacyLabelsToSuiteSync';

export type MetadataMigrationDep = {
    migrateLegacyLabelsToSuiteSync: MigrateLegacyLabelsToSuiteSync;
};

type CreateMetadataMigrationCompositionRootDeps = {
    getAccountsByDeviceState: GetAccountsByDeviceState;
    getLegacyWalletLabels: GetLegacyWalletLabels;
    getLegacyAccountLabels: GetLegacyAccountLabels;
    getCurrentWalletLabel: GetCurrentWalletLabel;
    getCurrentAccountLabels: GetCurrentAccountLabels;
} & UpdateWalletLabelDep &
    UpdateAccountLabelDep &
    UpdateAddressLabelDep &
    UpdateOutputLabelDep;

export const createMetadataMigrationCompositionRoot = (
    deps: CreateMetadataMigrationCompositionRootDeps,
): MetadataMigrationDep => {
    const migrateWalletLabels = createMigrateWalletLabels({
        getLegacyWalletLabels: deps.getLegacyWalletLabels,
        getCurrentWalletLabel: deps.getCurrentWalletLabel,
        updateWalletLabel: deps.updateWalletLabel,
    });
    const migrateAccountLabels = createMigrateAccountLabels({
        updateAccountLabel: deps.updateAccountLabel,
    });
    const migrateAddressLabels = createMigrateAddressLabels({
        updateAddressLabel: deps.updateAddressLabel,
    });
    const migrateOutputLabels = createMigrateOutputLabels({
        updateOutputLabel: deps.updateOutputLabel,
    });

    const migrateLegacyLabelsToSuiteSync = createMigrateLegacyLabelsToSuiteSync({
        getAccountsByDeviceState: deps.getAccountsByDeviceState,
        getLegacyAccountLabels: deps.getLegacyAccountLabels,
        getCurrentAccountLabels: deps.getCurrentAccountLabels,
        migrateWalletLabels,
        migrateAccountLabels,
        migrateAddressLabels,
        migrateOutputLabels,
    });

    return {
        migrateLegacyLabelsToSuiteSync,
    };
};
