import type { Dispatch } from '@reduxjs/toolkit';

import { createMockDeps, mock } from '@suite-common/dependency-injection';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createSuiteSyncStorageMock } from '../../tests/createSuiteSyncStorageMock.mock';
import { SuiteSyncUnavailableOnDeviceError } from '../createEnsureSuiteSyncKeys';
import { type CreateTurnOnSuiteSyncDeps, createTurnOnSuiteSync } from '../createTurnOnSuiteSync';
import type { GetDeviceForStaticSessionIdDep } from '../getDeviceForStaticSessionId';
import { setSuiteSyncError, updateSuiteSyncEnabled } from '../suiteSyncSlice';

const deviceStaticSessionId: StaticSessionId = '1@2:3';

const createConnectedDevice = () =>
    mockSuiteDevice({
        connected: true,
        available: true,
        state: { staticSessionId: deviceStaticSessionId },
    });

describe(createTurnOnSuiteSync.name, () => {
    it('returns ok early when suite sync is already enabled', async () => {
        const deps = createMockDeps<CreateTurnOnSuiteSyncDeps>({
            getIsSuiteSyncEnabled: () => true,
            dispatch: mock<Dispatch>(() => {}),
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(createSuiteSyncStorageMock())),
            getDeviceForStaticSessionId: () => createConnectedDevice(),
        });

        const turnOnSuiteSync = createTurnOnSuiteSync(deps);
        const result = await turnOnSuiteSync({ deviceStaticSessionId });

        expect(result).toEqual(ok());
        expect(deps.dispatch).not.toHaveBeenCalled();
        expect(deps.ensureWalletSuiteSyncOn).not.toHaveBeenCalled();
    });

    it('enables suite sync and ensures wallet sync when deviceStaticSessionId is provided', async () => {
        const storage = createSuiteSyncStorageMock();

        const deps = createMockDeps<CreateTurnOnSuiteSyncDeps>({
            getIsSuiteSyncEnabled: () => false,
            dispatch: mock<Dispatch>(() => {}),
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(storage)),
            getDeviceForStaticSessionId: () => createConnectedDevice(),
        });

        const turnOnSuiteSync = createTurnOnSuiteSync(deps);
        const result = await turnOnSuiteSync({ deviceStaticSessionId });

        expect(deps.dispatch).toHaveBeenCalledWith(updateSuiteSyncEnabled({ isEnabled: true }));
        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: false,
        });
        expect(result).toEqual(ok());
    });

    it('enables suite sync without calling ensureWalletSuiteSyncOn when deviceStaticSessionId is undefined', async () => {
        const deps = createMockDeps<CreateTurnOnSuiteSyncDeps>({
            getIsSuiteSyncEnabled: () => false,
            dispatch: mock<Dispatch>(() => {}),
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(createSuiteSyncStorageMock())),
            getDeviceForStaticSessionId: () => createConnectedDevice(),
        });

        const turnOnSuiteSync = createTurnOnSuiteSync(deps);
        const result = await turnOnSuiteSync({ deviceStaticSessionId: undefined });

        expect(deps.dispatch).toHaveBeenCalledWith(updateSuiteSyncEnabled({ isEnabled: true }));
        expect(deps.ensureWalletSuiteSyncOn).not.toHaveBeenCalled();
        expect(result).toEqual(ok());
    });

    it('enables suite sync and dispatches DeviceError when remembered device is disconnected', async () => {
        const deps = createMockDeps<CreateTurnOnSuiteSyncDeps & GetDeviceForStaticSessionIdDep>({
            getIsSuiteSyncEnabled: () => false,
            dispatch: mock<Dispatch>(() => {}),
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(createSuiteSyncStorageMock())),
            getDeviceForStaticSessionId: () =>
                mockSuiteDevice({
                    connected: false,
                    state: { staticSessionId: deviceStaticSessionId },
                }),
        });

        const turnOnSuiteSync = createTurnOnSuiteSync(deps);
        const result = await turnOnSuiteSync({ deviceStaticSessionId });

        expect(deps.dispatch).toHaveBeenCalledWith(updateSuiteSyncEnabled({ isEnabled: true }));
        expect(deps.dispatch).toHaveBeenCalledWith(
            setSuiteSyncError({
                deviceStaticSessionId,
                error: { type: 'DeviceError', message: 'Device not connected.' },
            }),
        );
        expect(deps.ensureWalletSuiteSyncOn).not.toHaveBeenCalled();
        expect(result).toEqual(ok());
    });

    it('returns ensureWalletSuiteSyncOn error when it fails', async () => {
        const ensureWalletSuiteSyncOnResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<CreateTurnOnSuiteSyncDeps>({
            getIsSuiteSyncEnabled: () => false,
            dispatch: mock<Dispatch>(() => {}),
            ensureWalletSuiteSyncOn: () => Promise.resolve(ensureWalletSuiteSyncOnResult),
            getDeviceForStaticSessionId: () => createConnectedDevice(),
        });

        const turnOnSuiteSync = createTurnOnSuiteSync(deps);
        const result = await turnOnSuiteSync({ deviceStaticSessionId });

        expect(deps.dispatch).toHaveBeenCalledWith(updateSuiteSyncEnabled({ isEnabled: true }));
        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: false,
        });
        expect(result).toBe(ensureWalletSuiteSyncOnResult);
    });
});
