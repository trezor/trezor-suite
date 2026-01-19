import type { TrezorDevice } from '@suite-common/suite-types';
import type { DeviceRootState } from '@suite-common/wallet-core';
import { deviceReducerInitialState } from '@suite-common/wallet-core';
import type { UnavailableCapabilities } from '@trezor/connect';
import { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createMockDeps } from '../../../tests/utils';
import { SuiteSyncUnavailableOnDeviceError } from '../../createRefreshSuiteSyncKeys';
import type { EnsureWalletSuiteSyncOnDeps } from '../createEnsureWalletSuiteSyncOn';
import { createEnsureWalletSuiteSyncOn } from '../createEnsureWalletSuiteSyncOn';
import { createSubscriptionStorageMock } from '../createSubscriptionStorage.mock';

const deviceStaticSessionId: StaticSessionId = '1@2:3';

const createMockState = (devices: TrezorDevice[] = []): DeviceRootState => ({
    device: {
        ...deviceReducerInitialState,
        devices,
    },
});

const createDevice = (overrides: Partial<TrezorDevice> = {}): TrezorDevice =>
    ({
        id: 'device-id',
        state: {
            staticSessionId: deviceStaticSessionId,
        },
        unavailableCapabilities: {},
        ...overrides,
    }) as unknown as TrezorDevice;

describe(createEnsureWalletSuiteSyncOn.name, () => {
    it('returns error when device is not found in state', async () => {
        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            getState: () => createMockState([]),
            ensureSuiteSyncData: null,
            subscriptionStorage: createSubscriptionStorageMock(),
            refreshSuiteSyncKeys: null,
            dispatch: null,
        });

        const ensureWalletSuiteSyncOn = createEnsureWalletSuiteSyncOn(deps);
        const result = await ensureWalletSuiteSyncOn({ deviceStaticSessionId });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.type).toBe('SuiteSyncUnavailableOnDeviceError');
        }
        expect(deps.ensureSuiteSyncData).not.toHaveBeenCalled();
    });

    it('returns error when Suite Sync is not supported by device', async () => {
        const unavailableCapabilities: UnavailableCapabilities = { evolu: 'no-support' };

        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            dispatch: null,
            getState: () => createMockState([createDevice({ unavailableCapabilities })]),
            refreshSuiteSyncKeys: null,
            ensureSuiteSyncData: null,
            subscriptionStorage: createSubscriptionStorageMock(),
        });

        const ensureWalletSuiteSyncOn = createEnsureWalletSuiteSyncOn(deps);
        const result = await ensureWalletSuiteSyncOn({ deviceStaticSessionId });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.type).toBe('SuiteSyncUnavailableOnDeviceError');
        }
        expect(deps.ensureSuiteSyncData).not.toHaveBeenCalled();
    });

    it('returns error when device needs firmware upgrade', async () => {
        const unavailableCapabilities: UnavailableCapabilities = { evolu: 'update-required' };

        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            dispatch: null,
            getState: () => createMockState([createDevice({ unavailableCapabilities })]),
            refreshSuiteSyncKeys: null,
            ensureSuiteSyncData: null,
            subscriptionStorage: createSubscriptionStorageMock(),
        });

        const ensureWalletSuiteSyncOn = createEnsureWalletSuiteSyncOn(deps);
        const result = await ensureWalletSuiteSyncOn({ deviceStaticSessionId });

        expect(!result.success && result.error.type).toBe(
            'SuiteSyncFirmwareUpgradeNeededDeviceErrorType',
        );
        expect(deps.ensureSuiteSyncData).not.toHaveBeenCalled();
    });

    it('calls ensureSuiteSyncData when wallet is eligible', async () => {
        const ensureResult = ok({ data: {} } as any);

        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            dispatch: null,
            getState: () => createMockState([createDevice()]),
            refreshSuiteSyncKeys: null,
            ensureSuiteSyncData: () => Promise.resolve(ensureResult),
            subscriptionStorage: createSubscriptionStorageMock(),
        });

        const ensureWalletSuiteSyncOn = createEnsureWalletSuiteSyncOn(deps);
        const result = await ensureWalletSuiteSyncOn({ deviceStaticSessionId });

        expect(deps.ensureSuiteSyncData).toHaveBeenCalledWith({ deviceStaticSessionId });
        expect(result).toBe(ensureResult);
    });

    it('propagates ensureSuiteSyncData error', async () => {
        const ensureResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            dispatch: null,
            getState: () => createMockState([createDevice()]),
            refreshSuiteSyncKeys: null,
            ensureSuiteSyncData: () => Promise.resolve(ensureResult),
            subscriptionStorage: createSubscriptionStorageMock(),
        });

        const ensureWalletSuiteSyncOn = createEnsureWalletSuiteSyncOn(deps);
        const result = await ensureWalletSuiteSyncOn({ deviceStaticSessionId });

        expect(deps.ensureSuiteSyncData).toHaveBeenCalledWith({ deviceStaticSessionId });
        expect(result).toBe(ensureResult);
    });
});
