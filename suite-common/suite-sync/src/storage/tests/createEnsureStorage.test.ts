import { createMockDeps, mock } from '@suite-common/dependency-injection';
import {
    type SuiteSyncOwner,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-sync-storage';
import { asDelegatedIdentityKey } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createSuiteSyncStorageMock } from '../../../tests/createSuiteSyncStorageMock.mock';
import { SuiteSyncUnavailableOnDeviceError } from '../../createRefreshSuiteSyncKeys';
import type { EnsureStorageDeps } from '../createEnsureStorage';
import { createEnsureStorage } from '../createEnsureStorage';

const OWNER_ABCD: SuiteSyncOwner = {
    ownerId: asSuiteSyncOwnerId('owner-id-abcd'),
    ownerSecret: asSuiteSyncOwnerSecretHex('owner-secret-abcd'),
};

const DELEGATED_KEY = asDelegatedIdentityKey('delegated-key-abcd');

const deviceStaticSessionId: StaticSessionId = '1@2:3';

describe(createEnsureStorage.name, () => {
    it('returns existing storage when the cached storage is allowed', async () => {
        const existingStorage = createSuiteSyncStorageMock();

        const deps = createMockDeps<EnsureStorageDeps>({
            getRelayUrl: () => 'wss://default-relay.example.com',
            getOwnerHasAllowance: () => true,
            suiteSyncStorageRepository: {
                get: () => existingStorage,
                set: null,
                delete: null,
            },
            createSuiteStorage: null,
            refreshSuiteSyncKeys: null,
            ensureQuota: null,
            getDeviceForStaticSessionId: null,
        });

        const result = await createEnsureStorage(deps)({
            deviceStaticSessionId,
            isWriteMode: false,
        });

        expect(result).toEqual(ok(existingStorage));
        expect(deps.suiteSyncStorageRepository.get).toHaveBeenCalled();
        expect(deps.createSuiteStorage).not.toHaveBeenCalled();
        expect(deps.refreshSuiteSyncKeys).not.toHaveBeenCalled();
        expect(deps.getDeviceForStaticSessionId).not.toHaveBeenCalled();
    });

    it('returns existing storage when it is already in repository and when write mode is on', async () => {
        const existingStorage = createSuiteSyncStorageMock({
            updateRelayUrl: mock(() => Promise.resolve()),
        });
        const device = mockSuiteDevice();

        const deps = createMockDeps<EnsureStorageDeps>({
            getRelayUrl: () => 'wss://default-relay.example.com',
            getOwnerHasAllowance: () => false,
            suiteSyncStorageRepository: {
                get: () => existingStorage,
                set: null,
                delete: null,
            },
            createSuiteStorage: null,
            refreshSuiteSyncKeys: () =>
                Promise.resolve(ok({ owner: OWNER_ABCD, delegatedKey: DELEGATED_KEY })),
            ensureQuota: () => Promise.resolve(ok(undefined)),
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureStorage(deps)({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        expect(result).toEqual(ok(existingStorage));
        expect(deps.suiteSyncStorageRepository.get).toHaveBeenCalled();
        expect(deps.createSuiteStorage).not.toHaveBeenCalled();
        expect(deps.refreshSuiteSyncKeys).toHaveBeenCalled();
        expect(deps.getDeviceForStaticSessionId).toHaveBeenCalled();
    });

    it('returns error when device is not found', async () => {
        const deps = createMockDeps<EnsureStorageDeps>({
            getRelayUrl: () => 'wss://default-relay.example.com',
            getOwnerHasAllowance: null,
            suiteSyncStorageRepository: {
                get: () => null,
                set: null,
                delete: null,
            },
            createSuiteStorage: null,
            refreshSuiteSyncKeys: null,
            ensureQuota: null,
            getDeviceForStaticSessionId: () => null,
        });

        const result = await createEnsureStorage(deps)({
            deviceStaticSessionId,
            isWriteMode: false,
        });

        expect(result.success).toBe(false);
        expect(!result.success && result.error.type).toBe('SuiteSyncUnavailableOnDeviceError');
        expect(deps.getDeviceForStaticSessionId).toHaveBeenCalledWith(deviceStaticSessionId);
        expect(deps.refreshSuiteSyncKeys).not.toHaveBeenCalled();
        expect(deps.createSuiteStorage).not.toHaveBeenCalled();
    });

    it('returns error when refreshSuiteSyncKeys fails', async () => {
        const device = mockSuiteDevice();
        const refreshError = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<EnsureStorageDeps>({
            getRelayUrl: () => 'wss://default-relay.example.com',
            getOwnerHasAllowance: null,
            suiteSyncStorageRepository: {
                get: () => null,
                set: null,
                delete: null,
            },
            createSuiteStorage: null,
            refreshSuiteSyncKeys: () => Promise.resolve(refreshError),
            ensureQuota: null,
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureStorage(deps)({
            deviceStaticSessionId,
            isWriteMode: false,
        });

        expect(result).toBe(refreshError);
        expect(deps.getDeviceForStaticSessionId).toHaveBeenCalledWith(deviceStaticSessionId);
        expect(deps.refreshSuiteSyncKeys).toHaveBeenCalledWith({ device });
        expect(deps.createSuiteStorage).not.toHaveBeenCalled();
    });

    it('calls ensureQuota with correct params after refreshSuiteSyncKeys succeeds', async () => {
        const device = mockSuiteDevice();
        const newStorage = createSuiteSyncStorageMock({
            updateRelayUrl: mock(() => Promise.resolve()),
        });

        const deps = createMockDeps<EnsureStorageDeps>({
            getRelayUrl: () => 'wss://default-relay.example.com',
            getOwnerHasAllowance: null,
            suiteSyncStorageRepository: {
                get: () => null,
                set: mock(() => {}),
                delete: null,
            },
            createSuiteStorage: () => newStorage,
            refreshSuiteSyncKeys: () =>
                Promise.resolve(ok({ owner: OWNER_ABCD, delegatedKey: DELEGATED_KEY })),
            ensureQuota: () => Promise.resolve(ok(undefined)),
            getDeviceForStaticSessionId: () => device,
        });

        await createEnsureStorage(deps)({
            deviceStaticSessionId,
            isWriteMode: false,
        });

        expect(deps.ensureQuota).toHaveBeenCalledWith({
            deviceStaticSessionId,
            delegatedKey: DELEGATED_KEY,
            owner: OWNER_ABCD,
            isWriteMode: false,
        });
    });

    it('does update relay URL when ensureQuota fails on WriteModeRequiredForAllocation', async () => {
        const device = mockSuiteDevice();
        const updateRelayUrl = mock(() => Promise.resolve());
        const newStorage = createSuiteSyncStorageMock({ updateRelayUrl });

        const deps = createMockDeps<EnsureStorageDeps>({
            getRelayUrl: () => 'wss://default-relay.example.com',
            getOwnerHasAllowance: null,
            suiteSyncStorageRepository: {
                get: () => null,
                set: mock(() => {}),
                delete: null,
            },
            createSuiteStorage: () => newStorage,
            refreshSuiteSyncKeys: () =>
                Promise.resolve(ok({ owner: OWNER_ABCD, delegatedKey: DELEGATED_KEY })),
            ensureQuota: () =>
                Promise.resolve(err({ type: 'WriteModeRequiredForAllocation' as const })),
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureStorage(deps)({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        expect(result).toEqual(ok(newStorage));
        expect(deps.createSuiteStorage).toHaveBeenCalled();
        expect(updateRelayUrl).toHaveBeenCalled();
    });

    it('creates and stores new storage when all dependencies succeed', async () => {
        const device = mockSuiteDevice();
        const newStorage = createSuiteSyncStorageMock({
            updateRelayUrl: mock(() => Promise.resolve()),
        });

        const deps = createMockDeps<EnsureStorageDeps>({
            getRelayUrl: () => 'wss://default-relay.example.com',
            getOwnerHasAllowance: null,
            suiteSyncStorageRepository: {
                get: () => null,
                set: mock(() => {}),
                delete: null,
            },
            createSuiteStorage: () => newStorage,
            refreshSuiteSyncKeys: () =>
                Promise.resolve(ok({ owner: OWNER_ABCD, delegatedKey: DELEGATED_KEY })),
            ensureQuota: () => Promise.resolve(ok(undefined)),
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureStorage(deps)({
            deviceStaticSessionId,
            isWriteMode: false,
        });

        expect(result).toEqual(ok(newStorage));
        expect(deps.getDeviceForStaticSessionId).toHaveBeenCalledWith(deviceStaticSessionId);
        expect(deps.refreshSuiteSyncKeys).toHaveBeenCalledWith({ device });
        expect(deps.createSuiteStorage).toHaveBeenCalledWith({
            suiteSyncOwner: OWNER_ABCD,
        });
        expect(newStorage.updateRelayUrl).toHaveBeenCalledWith('wss://default-relay.example.com');
        expect(deps.suiteSyncStorageRepository.set).toHaveBeenCalled();
    });

    it('calls updateRelayUrl with the relay URL from getRelayUrl', async () => {
        const device = mockSuiteDevice();

        const newStorage = createSuiteSyncStorageMock({
            updateRelayUrl: mock(() => Promise.resolve()),
        });

        const deps = createMockDeps<EnsureStorageDeps>({
            getRelayUrl: () => 'wss://custom-relay.example.com',
            getOwnerHasAllowance: null,
            suiteSyncStorageRepository: {
                get: () => null,
                set: mock(() => {}),
                delete: null,
            },
            createSuiteStorage: () => newStorage,
            refreshSuiteSyncKeys: () =>
                Promise.resolve(ok({ owner: OWNER_ABCD, delegatedKey: DELEGATED_KEY })),
            ensureQuota: () => Promise.resolve(ok(undefined)),
            getDeviceForStaticSessionId: () => device,
        });

        await createEnsureStorage(deps)({ deviceStaticSessionId, isWriteMode: false });

        expect(deps.createSuiteStorage).toHaveBeenCalledWith({
            suiteSyncOwner: OWNER_ABCD,
        });
        expect(newStorage.updateRelayUrl).toHaveBeenCalledWith('wss://custom-relay.example.com');
    });
});
