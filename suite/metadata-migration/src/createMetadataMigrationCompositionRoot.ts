import {
    type UpdateAccountLabelDep,
    type UpdateAddressLabelDep,
    type UpdateOutputLabelDep,
    type UpdateWalletLabelDep,
} from '@suite-common/suite-sync-types';
import type { TrezorDevice } from '@suite-common/suite-types';

import { createMigrateAccountLabels } from './entities/createMigrateAccountLabels';
import { createMigrateAddressLabels } from './entities/createMigrateAddressLabels';
import { createMigrateOutputLabels } from './entities/createMigrateOutputLabels';
import { createMigrateWalletLabels } from './entities/createMigrateWalletLabels';
import type {
    GetAccountsByDeviceState,
    GetCurrentAccountLabels,
    GetCurrentWalletLabel,
    GetDevices,
    GetLegacyAccountLabels,
    GetLegacyWalletLabels,
} from './legacyLabelsMigration';
import {
    type MigrateLegacyLabelsToSuiteSync,
    createMigrateLegacyLabelsToSuiteSync,
} from './migrateLegacyLabelsToSuiteSync';
import { getConnectedMigratableDevices } from './migrationUtils';

export type MetadataMigrationDep = {
    migrateLegacyLabelsToSuiteSync: MigrateLegacyLabelsToSuiteSync;
};

type GetAllDevices = () => TrezorDevice[];

type CreateMetadataMigrationCompositionRootDeps = {
    getDevices: GetAllDevices;
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
    const getMigratableDevices: GetDevices = () => getConnectedMigratableDevices(deps.getDevices());

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
        getDevices: getMigratableDevices,
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
