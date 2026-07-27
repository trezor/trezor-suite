import type { Dispatch } from '@reduxjs/toolkit';

import { metadataActions } from '@suite/metadata';
import { createMockDeps } from '@suite-common/dependency-injection';
import { isTrezorDeviceWithState } from '@suite-common/device';
import { type MetadataProvider } from '@suite-common/metadata-types';
import { createSuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { mockSuiteSyncStorage } from '@suite-common/suite-sync-storage/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { StaticSessionId } from '@trezor/connect';
import { asWalletDescriptor } from '@trezor/device-utils';
import { type Result, err, ok } from '@trezor/type-utils';
import { createDeferred } from '@trezor/utils';

import {
    type CreateMigrateLabelsIfAvailableDeps,
    createMigrateLabelsIfAvailable,
} from '../createMigrateLabelsIfAvailable';
import { type MigrationCounts, type MigrationError } from '../legacyLabelsMigration';

const DEVICE_STATIC_SESSION_ID: StaticSessionId = 'device@wallet:1';
const WALLET_DESCRIPTOR = asWalletDescriptor('device');

const createDevice = (staticSessionId: StaticSessionId = DEVICE_STATIC_SESSION_ID) => {
    const device = mockSuiteDevice({
        connected: true,
        available: true,
        id: 'device-id',
        state: { staticSessionId },
    });

    if (!isTrezorDeviceWithState(device)) {
        throw new Error('Expected device with static session id.');
    }

    return device;
};

const metadataProvider = { type: 'dropbox' } as MetadataProvider;

describe(createMigrateLabelsIfAvailable.name, () => {
    it('dispatches migration flag and success toast after successful migration with changes', async () => {
        const device = createDevice();
        const dispatch: Dispatch = jest.fn();
        const deps = createMockDeps<CreateMigrateLabelsIfAvailableDeps>({
            dispatch,
            migrateLegacyLabelsToSuiteSync: () => Promise.resolve(ok({ changed: 2, skipped: 1 })),
            getIsMetadataEnabled: () => true,
            getSelectedProviderForLabels: () => metadataProvider,
            getHasLegacyLabelsMigrated: () => false,
            getDeviceByStaticSessionId: () => device,
        });
        const listener = createMigrateLabelsIfAvailable(deps);

        const storage = mockSuiteSyncStorage();

        await listener({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID,
            isWriteMode: false,
            storage,
        });

        expect(deps.migrateLegacyLabelsToSuiteSync).toHaveBeenCalledWith(device, storage);
        expect(deps.dispatch).toHaveBeenNthCalledWith(
            1,
            metadataActions.setLegacyLabelsMigrationForWallet(WALLET_DESCRIPTOR),
        );
        expect(deps.dispatch).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                type: '@common/in-app-notifications/addToast',
                payload: expect.objectContaining({
                    type: 'legacy-labeling-migration-success',
                    added: 2,
                    skipped: 1,
                }),
            }),
        );
    });

    it('skips migration when wallet has already been migrated', async () => {
        const dispatch: Dispatch = jest.fn();
        const deps = createMockDeps<CreateMigrateLabelsIfAvailableDeps>({
            dispatch,
            migrateLegacyLabelsToSuiteSync: () => Promise.resolve(ok({ changed: 2, skipped: 1 })),
            getIsMetadataEnabled: () => true,
            getSelectedProviderForLabels: () => metadataProvider,
            getHasLegacyLabelsMigrated: () => true,
            getDeviceByStaticSessionId: () => createDevice(),
        });
        const listener = createMigrateLabelsIfAvailable(deps);

        await listener({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID,
            isWriteMode: false,
            storage: mockSuiteSyncStorage(),
        });

        expect(deps.migrateLegacyLabelsToSuiteSync).not.toHaveBeenCalled();
        expect(deps.dispatch).not.toHaveBeenCalled();
    });

    it('does not run multiple migrations for the same wallet at the same time', async () => {
        const device = createDevice();
        const migration = createDeferred<Result<MigrationCounts, MigrationError>>();
        const dispatch: Dispatch = jest.fn();
        const deps = createMockDeps<CreateMigrateLabelsIfAvailableDeps>({
            dispatch,
            migrateLegacyLabelsToSuiteSync: () => migration.promise,
            getIsMetadataEnabled: () => true,
            getSelectedProviderForLabels: () => metadataProvider,
            getHasLegacyLabelsMigrated: () => false,
            getDeviceByStaticSessionId: () => device,
        });
        const listener = createMigrateLabelsIfAvailable(deps);

        const firstMigration = listener({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID,
            isWriteMode: false,
            storage: mockSuiteSyncStorage(),
        });

        await listener({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID,
            isWriteMode: false,
            storage: mockSuiteSyncStorage(),
        });

        expect(deps.migrateLegacyLabelsToSuiteSync).toHaveBeenCalledTimes(1);

        migration.resolve(ok({ changed: 0, skipped: 0 }));
        await firstMigration;

        expect(deps.dispatch).toHaveBeenCalledWith(
            metadataActions.setLegacyLabelsMigrationForWallet(WALLET_DESCRIPTOR),
        );
    });

    it('runs migrations for different wallets at the same time', async () => {
        const dispatch: Dispatch = jest.fn();

        const firstDeviceStaticSessionId: StaticSessionId = 'first-wallet@device:1';
        const firstDevice = createDevice(firstDeviceStaticSessionId);
        const firstMigration = createDeferred<Result<MigrationCounts, MigrationError>>();

        const secondDeviceStaticSessionId: StaticSessionId = 'second-wallet@device:1';
        const secondDevice = createDevice(secondDeviceStaticSessionId);
        const secondMigration = createDeferred<Result<MigrationCounts, MigrationError>>();

        const deps = createMockDeps<CreateMigrateLabelsIfAvailableDeps>({
            dispatch,
            migrateLegacyLabelsToSuiteSync: selectedDevice => {
                if (selectedDevice === firstDevice) {
                    return firstMigration.promise;
                }

                return secondMigration.promise;
            },
            getIsMetadataEnabled: () => true,
            getSelectedProviderForLabels: () => metadataProvider,
            getHasLegacyLabelsMigrated: () => false,
            getDeviceByStaticSessionId: deviceStaticSessionId => {
                if (deviceStaticSessionId === firstDeviceStaticSessionId) {
                    return firstDevice;
                }

                return secondDevice;
            },
        });
        const listener = createMigrateLabelsIfAvailable(deps);

        const firstListenerResult = listener({
            deviceStaticSessionId: firstDeviceStaticSessionId,
            isWriteMode: false,
            storage: mockSuiteSyncStorage(),
        });
        const secondListenerResult = listener({
            deviceStaticSessionId: secondDeviceStaticSessionId,
            isWriteMode: false,
            storage: mockSuiteSyncStorage(),
        });

        expect(deps.migrateLegacyLabelsToSuiteSync).toHaveBeenCalledTimes(2);
        expect(deps.migrateLegacyLabelsToSuiteSync).toHaveBeenCalledWith(
            firstDevice,
            expect.anything(),
        );
        expect(deps.migrateLegacyLabelsToSuiteSync).toHaveBeenCalledWith(
            secondDevice,
            expect.anything(),
        );

        firstMigration.resolve(ok({ changed: 0, skipped: 0 }));
        secondMigration.resolve(ok({ changed: 0, skipped: 0 }));
        await Promise.all([firstListenerResult, secondListenerResult]);

        expect(deps.dispatch).toHaveBeenCalledWith(
            metadataActions.setLegacyLabelsMigrationForWallet(asWalletDescriptor('first-wallet')),
        );
        expect(deps.dispatch).toHaveBeenCalledWith(
            metadataActions.setLegacyLabelsMigrationForWallet(asWalletDescriptor('second-wallet')),
        );
    });

    it('marks wallet as migrated without showing toast when nothing changed', async () => {
        const dispatch: Dispatch = jest.fn();
        const deps = createMockDeps<CreateMigrateLabelsIfAvailableDeps>({
            dispatch,
            migrateLegacyLabelsToSuiteSync: () => Promise.resolve(ok({ changed: 0, skipped: 3 })),
            getIsMetadataEnabled: () => true,
            getSelectedProviderForLabels: () => metadataProvider,
            getHasLegacyLabelsMigrated: () => false,
            getDeviceByStaticSessionId: () => createDevice(),
        });
        const listener = createMigrateLabelsIfAvailable(deps);

        await listener({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID,
            isWriteMode: false,
            storage: mockSuiteSyncStorage(),
        });

        expect(deps.dispatch).toHaveBeenCalledTimes(1);
        expect(deps.dispatch).toHaveBeenCalledWith(
            metadataActions.setLegacyLabelsMigrationForWallet(WALLET_DESCRIPTOR),
        );
    });

    it('reports migration errors and does not dispatch success actions', async () => {
        const cause = createSuiteSyncUpdateError(new Error('migration failed'));

        const dispatch: Dispatch = jest.fn();
        const deps = createMockDeps<CreateMigrateLabelsIfAvailableDeps>({
            dispatch,
            migrateLegacyLabelsToSuiteSync: () =>
                Promise.resolve(
                    err({
                        type: 'update-failed' as const,
                        entity: 'wallet' as const,
                        deviceStaticSessionId: DEVICE_STATIC_SESSION_ID,
                        cause,
                    }),
                ),
            getIsMetadataEnabled: () => true,
            getSelectedProviderForLabels: () => metadataProvider,
            getHasLegacyLabelsMigrated: () => false,
            getDeviceByStaticSessionId: () => createDevice(),
        });
        const listener = createMigrateLabelsIfAvailable(deps);

        await listener({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID,
            isWriteMode: false,
            storage: mockSuiteSyncStorage(),
        });

        expect(deps.dispatch).toHaveBeenCalledTimes(1);
        expect(deps.dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: '@common/in-app-notifications/addToast',
                payload: expect.objectContaining({
                    type: 'error',
                    error: 'Failed to update Suite Sync data.',
                }),
            }),
        );
    });
});
