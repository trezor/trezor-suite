import { Dispatch } from '@reduxjs/toolkit';

import { createMockDeps, mock } from '@suite-common/dependency-injection';
import type { TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { DeviceRootState } from '@suite-common/wallet-core';
import { deviceReducerInitialState } from '@suite-common/wallet-core';
import type { UnavailableCapabilities } from '@trezor/connect';
import { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { SuiteSyncUnavailableOnDeviceError } from '../../createRefreshSuiteSyncKeys';
import type { EnsureWalletSuiteSyncOnDeps } from '../createEnsureWalletSuiteSyncOn';
import { createEnsureWalletSuiteSyncOn } from '../createEnsureWalletSuiteSyncOn';
import { createSubscriptionStorageMock } from '../createSubscriptionStorage.mock';

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

const DEVICE_123 = mockSuiteDevice({ state: DEVICE_STATIC_SESSION_ID_123 });

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
            ensureSuiteSyncData: null,
            subscriptionStorage: createSubscriptionStorageMock(),
            refreshSuiteSyncKeys: null,
            dispatch: null,
        });

        const result = await createEnsureWalletSuiteSyncOn(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
        });

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
            getState: () => createMockState([mockSuiteDevice({ unavailableCapabilities })]),
            refreshSuiteSyncKeys: null,
            ensureSuiteSyncData: null,
            subscriptionStorage: createSubscriptionStorageMock(),
        });

        const result = await createEnsureWalletSuiteSyncOn(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.type).toBe('SuiteSyncUnavailableOnDeviceError');
        }
        expect(deps.ensureSuiteSyncData).not.toHaveBeenCalled();
    });

    it('returns error when device needs firmware upgrade', async () => {
        const unavailableCapabilities: UnavailableCapabilities = { evolu: 'update-required' };
        const device = mockSuiteDevice({
            unavailableCapabilities,
            state: DEVICE_STATIC_SESSION_ID_123,
        });

        if (device.state?.staticSessionId === undefined) {
            throw new Error('staticSessionId is undefined');
        }

        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            dispatch: null,
            getState: () => createMockState([device]),
            refreshSuiteSyncKeys: null,
            ensureSuiteSyncData: null,
            subscriptionStorage: createSubscriptionStorageMock(),
        });

        const result = await createEnsureWalletSuiteSyncOn(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
        });

        expect(!result.success && result.error.type).toBe(
            'SuiteSyncFirmwareUpgradeNeededDeviceErrorType',
        );
        expect(deps.ensureSuiteSyncData).not.toHaveBeenCalled();
    });

    it('calls ensureSuiteSyncData when wallet is eligible', async () => {
        const ensureResult = ok({ data: {} } as any);

        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            dispatch: mock<Dispatch>(() => {}),
            getState: () => createMockState([DEVICE_123]),
            refreshSuiteSyncKeys: null,
            ensureSuiteSyncData: () => Promise.resolve(ensureResult),
            subscriptionStorage: createSubscriptionStorageMock(),
        });

        const result = await createEnsureWalletSuiteSyncOn(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
        });

        expect(deps.ensureSuiteSyncData).toHaveBeenCalledWith({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
        });
        expect(result).toBe(ensureResult);
    });

    it('propagates ensureSuiteSyncData error', async () => {
        const ensureResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<EnsureWalletSuiteSyncOnDeps>({
            dispatch: mock<Dispatch>(() => {}),
            getState: () => createMockState([DEVICE_123]),
            refreshSuiteSyncKeys: null,
            ensureSuiteSyncData: () => Promise.resolve(ensureResult),
            subscriptionStorage: createSubscriptionStorageMock(),
        });

        const result = await createEnsureWalletSuiteSyncOn(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
        });

        expect(deps.ensureSuiteSyncData).toHaveBeenCalledWith({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
        });
        expect(result).toBe(ensureResult);
    });
});
