import type { Dispatch } from '@reduxjs/toolkit';

import { metadataActions } from '@suite/metadata';
import { createMockDeps } from '@suite-common/dependency-injection';
import { isTrezorDeviceWithState } from '@suite-common/device';
import { type MetadataProvider } from '@suite-common/metadata-types';
import { createSuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { notificationsActions } from '@suite-common/toast-notifications';
import { asWalletDescriptor } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import {
    type CreateMigrateLabelsIfAvailableDeps,
    createMigrateLabelsIfAvailable,
} from '../createEnsureWalletSuiteSyncOnWithMigration';

const DEVICE_STATIC_SESSION_ID: StaticSessionId = 'device@wallet:1';
const WALLET_DESCRIPTOR = asWalletDescriptor('wallet');

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

        await listener({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID,
            isWriteMode: false,
            storage: {} as any,
        });

        expect(deps.migrateLegacyLabelsToSuiteSync).toHaveBeenCalledWith(device);
        expect(deps.dispatch).toHaveBeenNthCalledWith(
            1,
            metadataActions.setLegacyLabelsMigrationForWallet(WALLET_DESCRIPTOR),
        );
        expect(deps.dispatch).toHaveBeenNthCalledWith(
            2,
            notificationsActions.addToast({
                type: 'legacy-labeling-migration-success',
                added: 2,
                skipped: 1,
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
            storage: {} as any,
        });

        expect(deps.migrateLegacyLabelsToSuiteSync).not.toHaveBeenCalled();
        expect(deps.dispatch).not.toHaveBeenCalled();
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
            storage: {} as any,
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
            storage: {} as any,
        });

        expect(deps.dispatch).not.toHaveBeenCalled();
    });
});
