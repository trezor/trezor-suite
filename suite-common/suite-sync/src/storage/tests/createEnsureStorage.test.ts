import { createMockDeps, mock } from '@suite-common/dependency-injection';
import {
    SuiteSyncOwner,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-types';
import { getSuiteDevice } from '@suite-common/test-utils';
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

const deviceStaticSessionId: StaticSessionId = '1@2:3';

describe(createEnsureStorage.name, () => {
    it('returns existing storage when it is already in repository', async () => {
        const existingStorage = createSuiteSyncStorageMock();

        const deps = createMockDeps<EnsureStorageDeps>({
            defaultRelayUrl: 'wss://default-relay.example.com',
            getRelayUrl: () => null,
            suiteSyncStorageRepository: {
                get: () => existingStorage,
                set: null,
                delete: null,
            },
            createSuiteStorage: null,
            refreshSuiteSyncKeys: null,
            getDeviceForStaticSessionId: null,
        });

        const result = await createEnsureStorage(deps)({ deviceStaticSessionId });

        expect(result).toEqual(ok(existingStorage));
        expect(deps.suiteSyncStorageRepository.get).toHaveBeenCalled();
        expect(deps.createSuiteStorage).not.toHaveBeenCalled();
        expect(deps.refreshSuiteSyncKeys).not.toHaveBeenCalled();
        expect(deps.getDeviceForStaticSessionId).not.toHaveBeenCalled();
    });

    it('returns error when device is not found', async () => {
        const deps = createMockDeps<EnsureStorageDeps>({
            defaultRelayUrl: 'wss://default-relay.example.com',
            getRelayUrl: () => null,
            suiteSyncStorageRepository: {
                get: () => null,
                set: null,
                delete: null,
            },
            createSuiteStorage: null,
            refreshSuiteSyncKeys: null,
            getDeviceForStaticSessionId: () => null,
        });

        const result = await createEnsureStorage(deps)({ deviceStaticSessionId });

        expect(result.success).toBe(false);
        expect(!result.success && result.error.type).toBe('SuiteSyncUnavailableOnDeviceError');
        expect(deps.getDeviceForStaticSessionId).toHaveBeenCalledWith(deviceStaticSessionId);
        expect(deps.refreshSuiteSyncKeys).not.toHaveBeenCalled();
        expect(deps.createSuiteStorage).not.toHaveBeenCalled();
    });

    it('returns error when refreshSuiteSyncKeys fails', async () => {
        const device = getSuiteDevice();
        const refreshError = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<EnsureStorageDeps>({
            defaultRelayUrl: 'wss://default-relay.example.com',
            getRelayUrl: () => null,
            suiteSyncStorageRepository: {
                get: () => null,
                set: null,
                delete: null,
            },
            createSuiteStorage: null,
            refreshSuiteSyncKeys: () => Promise.resolve(refreshError),
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureStorage(deps)({ deviceStaticSessionId });

        expect(result).toBe(refreshError);
        expect(deps.getDeviceForStaticSessionId).toHaveBeenCalledWith(deviceStaticSessionId);
        expect(deps.refreshSuiteSyncKeys).toHaveBeenCalledWith({ device });
        expect(deps.createSuiteStorage).not.toHaveBeenCalled();
    });

    it('creates and stores new storage when all dependencies succeed', async () => {
        const device = getSuiteDevice();
        const newStorage = createSuiteSyncStorageMock();

        const deps = createMockDeps<EnsureStorageDeps>({
            defaultRelayUrl: 'wss://default-relay.example.com',
            getRelayUrl: () => null,
            suiteSyncStorageRepository: {
                get: () => null,
                set: mock(() => {}),
                delete: null,
            },
            createSuiteStorage: () => newStorage,
            refreshSuiteSyncKeys: () => Promise.resolve(ok(OWNER_ABCD)),
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureStorage(deps)({ deviceStaticSessionId });

        expect(result).toEqual(ok(newStorage));
        expect(deps.getDeviceForStaticSessionId).toHaveBeenCalledWith(deviceStaticSessionId);
        expect(deps.refreshSuiteSyncKeys).toHaveBeenCalledWith({ device });
        expect(deps.createSuiteStorage).toHaveBeenCalledWith({
            suiteSyncOwner: OWNER_ABCD,
            relayUrl: 'wss://default-relay.example.com',
        });
        expect(deps.suiteSyncStorageRepository.set).toHaveBeenCalled();
    });

    it('uses custom relay URL when provided and not empty', async () => {
        const device = getSuiteDevice();

        const newStorage = createSuiteSyncStorageMock();
        const customRelayUrl = 'wss://custom-relay.example.com';

        const deps = createMockDeps<EnsureStorageDeps>({
            defaultRelayUrl: 'wss://default-relay.example.com',
            getRelayUrl: () => customRelayUrl,
            suiteSyncStorageRepository: {
                get: () => null,
                set: mock(() => {}),
                delete: null,
            },
            createSuiteStorage: () => newStorage,
            refreshSuiteSyncKeys: () => Promise.resolve(ok(OWNER_ABCD)),
            getDeviceForStaticSessionId: () => device,
        });

        const ensureStorage = createEnsureStorage(deps);
        const result = await ensureStorage({ deviceStaticSessionId });

        expect(result).toEqual(ok(newStorage));
        expect(deps.createSuiteStorage).toHaveBeenCalledWith({
            suiteSyncOwner: OWNER_ABCD,
            relayUrl: customRelayUrl,
        });
    });

    it('uses default relay URL when custom relay URL is empty string', async () => {
        const device = getSuiteDevice();

        const newStorage = createSuiteSyncStorageMock();

        const deps = createMockDeps<EnsureStorageDeps>({
            defaultRelayUrl: 'wss://default-relay.example.com',
            getRelayUrl: () => '',
            suiteSyncStorageRepository: {
                get: () => null,
                set: mock(() => {}),
                delete: null,
            },
            createSuiteStorage: () => newStorage,
            refreshSuiteSyncKeys: () => Promise.resolve(ok(OWNER_ABCD)),
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureStorage(deps)({ deviceStaticSessionId });

        expect(result).toEqual(ok(newStorage));
        expect(deps.createSuiteStorage).toHaveBeenCalledWith({
            suiteSyncOwner: OWNER_ABCD,
            relayUrl: 'wss://default-relay.example.com',
        });
    });

    it('uses default relay URL when custom relay URL is whitespace only', async () => {
        const device = getSuiteDevice();

        const newStorage = createSuiteSyncStorageMock();

        const deps = createMockDeps<EnsureStorageDeps>({
            defaultRelayUrl: 'wss://default-relay.example.com',
            getRelayUrl: () => '   ',
            suiteSyncStorageRepository: {
                get: () => null,
                set: mock(() => {}),
                delete: null,
            },
            createSuiteStorage: () => newStorage,
            refreshSuiteSyncKeys: () => Promise.resolve(ok(OWNER_ABCD)),
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureStorage(deps)({ deviceStaticSessionId });

        expect(result).toEqual(ok(newStorage));
        expect(deps.createSuiteStorage).toHaveBeenCalledWith({
            suiteSyncOwner: OWNER_ABCD,
            relayUrl: 'wss://default-relay.example.com',
        });
    });
});
