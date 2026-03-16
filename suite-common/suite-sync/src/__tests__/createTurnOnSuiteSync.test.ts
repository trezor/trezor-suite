import type { Dispatch } from '@reduxjs/toolkit';

import { createMockDeps, mock } from '@suite-common/dependency-injection';
import type { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createSuiteSyncStorageMock } from '../../tests/createSuiteSyncStorageMock.mock';
import { SuiteSyncUnavailableOnDeviceError } from '../createRefreshSuiteSyncKeys';
import { type CreateTurnOnSuiteSyncDeps, createTurnOnSuiteSync } from '../createTurnOnSuiteSync';
import { updateSuiteSyncEnabled } from '../suiteSyncSlice';

const deviceStaticSessionId: StaticSessionId = '1@2:3';

describe(createTurnOnSuiteSync.name, () => {
    it('returns ok early when suite sync is already enabled', async () => {
        const deps = createMockDeps<CreateTurnOnSuiteSyncDeps>({
            getIsSuiteSyncEnabled: () => true,
            dispatch: mock<Dispatch>(() => {}),
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(createSuiteSyncStorageMock())),
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
        });

        const turnOnSuiteSync = createTurnOnSuiteSync(deps);
        const result = await turnOnSuiteSync({ deviceStaticSessionId: undefined });

        expect(deps.dispatch).toHaveBeenCalledWith(updateSuiteSyncEnabled({ isEnabled: true }));
        expect(deps.ensureWalletSuiteSyncOn).not.toHaveBeenCalled();
        expect(result).toEqual(ok());
    });

    it('returns ensureWalletSuiteSyncOn error when it fails', async () => {
        const ensureWalletSuiteSyncOnResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<CreateTurnOnSuiteSyncDeps>({
            getIsSuiteSyncEnabled: () => false,
            dispatch: mock<Dispatch>(() => {}),
            ensureWalletSuiteSyncOn: () => Promise.resolve(ensureWalletSuiteSyncOnResult),
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
