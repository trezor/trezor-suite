import { createMockDeps } from '@suite-common/dependency-injection';
import type { DeviceRootState } from '@suite-common/device';
import { deviceReducerInitialState } from '@suite-common/device';
import type { TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { StaticSessionId, UnavailableCapabilities } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { SuiteSyncUnavailableOnDeviceError } from '../../createEnsureSuiteSyncKeys';
import type { EnsureWalletSuiteSyncOnDeps } from '../createEnsureWalletSuiteSyncOn';
import { createEnsureWalletSuiteSyncOn } from '../createEnsureWalletSuiteSyncOn';
import { createSubscriptionStorageMock } from '../createSubscriptionStorage.mock';

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

const DEVICE_123 = mockSuiteDevice({ state: { staticSessionId: DEVICE_STATIC_SESSION_ID_123 } });

const createMockState = (devices: TrezorDevice[] = []): DeviceRootState => ({
    device: {
        ...deviceReducerInitialState,
        devices,
    },
});

describe(createEnsureWalletSuiteSyncOn.name, () => {
    it('returns error when device is not found in state', async () => {
        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            getState: () => createMockState([]),
            ensureSubscribedStorage: null,
            subscriptionStorage: createSubscriptionStorageMock(),
            ensureSuiteSyncKeys: null,
        });

        const result = await createEnsureWalletSuiteSyncOn(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.type).toBe('SuiteSyncUnavailableOnDeviceError');
        }
        expect(deps.ensureSubscribedStorage).not.toHaveBeenCalled();
    });

    it('returns error when Suite Sync is not supported by device', async () => {
        const unavailableCapabilities: UnavailableCapabilities = { evolu: 'no-support' };

        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            getState: () => createMockState([mockSuiteDevice({ unavailableCapabilities })]),
            ensureSuiteSyncKeys: null,
            ensureSubscribedStorage: null,
            subscriptionStorage: createSubscriptionStorageMock(),
        });

        const result = await createEnsureWalletSuiteSyncOn(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.type).toBe('SuiteSyncUnavailableOnDeviceError');
        }
        expect(deps.ensureSubscribedStorage).not.toHaveBeenCalled();
    });

    it('calls ensureSubscribedStorage when wallet is eligible', async () => {
        const ensureResult = ok({ data: {} } as any);

        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            getState: () => createMockState([DEVICE_123]),
            ensureSuiteSyncKeys: null,
            ensureSubscribedStorage: () => Promise.resolve(ensureResult),
            subscriptionStorage: createSubscriptionStorageMock(),
        });

        const result = await createEnsureWalletSuiteSyncOn(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });

        expect(deps.ensureSubscribedStorage).toHaveBeenCalledWith({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });
        expect(result).toBe(ensureResult);
    });

    it('propagates ensureSubscribedStorage error', async () => {
        const ensureResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            getState: () => createMockState([DEVICE_123]),
            ensureSuiteSyncKeys: null,
            ensureSubscribedStorage: () => Promise.resolve(ensureResult),
            subscriptionStorage: createSubscriptionStorageMock(),
        });

        const result = await createEnsureWalletSuiteSyncOn(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });

        expect(deps.ensureSubscribedStorage).toHaveBeenCalledWith({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });
        expect(result).toBe(ensureResult);
    });
});
