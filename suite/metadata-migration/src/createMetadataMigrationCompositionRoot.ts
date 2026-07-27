import { type Dispatch } from '@reduxjs/toolkit';

import {
    type MetadataRootState,
    selectHasLegacyLabelsMigrated,
    selectIsMetadataEnabled,
    selectLabelingDataForAccount,
    selectLabelingDataForWallet,
    selectSelectedProviderForLabels,
} from '@suite/metadata';
import { toGetter } from '@suite-common/dependency-injection';
import { type OnStorageEnsured, type WriteLabelsDep } from '@suite-common/suite-sync-types';
import { type TrezorDevice } from '@suite-common/suite-types';

import { createMigrateLabelsIfAvailable } from './createMigrateLabelsIfAvailable';
import { createMigrateAccountLabels } from './entities/createMigrateAccountLabels';
import { createMigrateAddressLabels } from './entities/createMigrateAddressLabels';
import { createMigrateOutputLabels } from './entities/createMigrateOutputLabels';
import { createMigrateWalletLabels } from './entities/createMigrateWalletLabels';
import type {
    GetAccountsByDeviceState,
    GetCurrentAccountLabels,
    GetCurrentWalletLabel,
    GetLegacyWalletLabels,
} from './legacyLabelsMigration';
import {
    type MigrateLegacyLabelsToSuiteSync,
    createMigrateLegacyLabelsToSuiteSync,
} from './migrateLegacyLabelsToSuiteSync';

export type MetadataMigrationDep = {
    migrateLegacyLabelsToSuiteSync: MigrateLegacyLabelsToSuiteSync;
};

export const selectMetadataMigrationDep = (services: any): MetadataMigrationDep => ({
    migrateLegacyLabelsToSuiteSync: services.migrateLegacyLabelsToSuiteSync,
});

type CreateMetadataMigrationCompositionRootDeps = {
    dispatch: Dispatch;
    getState: () => MetadataRootState;
    getAccountsByDeviceState: GetAccountsByDeviceState;
    getCurrentWalletLabel: GetCurrentWalletLabel;
    getCurrentAccountLabels: GetCurrentAccountLabels;
    getDeviceByStaticSessionId: (
        deviceStaticSessionId: Parameters<GetLegacyWalletLabels>[0],
    ) => TrezorDevice | undefined;
} & WriteLabelsDep;

type MetadataMigrationCompositionRootResult = MetadataMigrationDep & {
    migrateLabelsIfAvailable: OnStorageEnsured;
};

export const createMetadataMigrationCompositionRoot = (
    deps: CreateMetadataMigrationCompositionRootDeps,
): MetadataMigrationCompositionRootResult => {
    const getIsMetadataEnabled = toGetter(deps.getState, selectIsMetadataEnabled);
    const getSelectedProviderForLabels = toGetter(deps.getState, selectSelectedProviderForLabels);
    const getHasLegacyLabelsMigrated = toGetter(deps.getState, selectHasLegacyLabelsMigrated);

    const migrateLegacyLabelsToSuiteSync = createMigrateLegacyLabelsToSuiteSync({
        getAccountsByDeviceState: deps.getAccountsByDeviceState,
        getLegacyAccountLabels: toGetter(deps.getState, selectLabelingDataForAccount),
        getCurrentAccountLabels: deps.getCurrentAccountLabels,
        migrateWalletLabels: createMigrateWalletLabels({
            getLegacyWalletLabels: toGetter(deps.getState, selectLabelingDataForWallet),
            getCurrentWalletLabel: deps.getCurrentWalletLabel,
            writeWalletLabel: deps.writeWalletLabel,
        }),
        migrateAccountLabels: createMigrateAccountLabels({
            writeAccountLabel: deps.writeAccountLabel,
        }),
        migrateAddressLabels: createMigrateAddressLabels({
            writeAddressLabel: deps.writeAddressLabel,
        }),
        migrateOutputLabels: createMigrateOutputLabels({
            writeOutputLabel: deps.writeOutputLabel,
        }),
    });

    const migrateLabelsIfAvailable = createMigrateLabelsIfAvailable({
        dispatch: deps.dispatch,
        migrateLegacyLabelsToSuiteSync,
        getIsMetadataEnabled,
        getSelectedProviderForLabels,
        getHasLegacyLabelsMigrated,
        getDeviceByStaticSessionId: deps.getDeviceByStaticSessionId,
    });

    return {
        migrateLabelsIfAvailable,
        migrateLegacyLabelsToSuiteSync,
    };
};
