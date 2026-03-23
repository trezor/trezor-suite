import type { Dispatch } from '@reduxjs/toolkit';

import { createMockDeps, mock } from '@suite-common/dependency-injection';
import type { StaticSessionId } from '@trezor/connect';

import { type CreateTurnOffSuiteSyncDeps, createTurnOffSuiteSync } from '../createTurnOffSuiteSync';
import { clearAll } from '../data/suiteSyncDataReducer';
import { updateSuiteSyncEnabled } from '../suiteSyncSlice';

const deviceStaticSessionId1: StaticSessionId = '1@2:3';
const deviceStaticSessionId2: StaticSessionId = '4@5:6';

describe(createTurnOffSuiteSync.name, () => {
    it('returns early when suite sync is already disabled', async () => {
        const deps = createMockDeps<CreateTurnOffSuiteSyncDeps>({
            getIsSuiteSyncEnabled: () => false,
            dispatch: mock<Dispatch>(() => {}),
            getAllDeviceSessionIds: () => [],
            turnOffSuiteSyncForWallet: () => Promise.resolve(),
            reloadApp: () => {},
        });

        const turnOffSuiteSync = createTurnOffSuiteSync(deps);
        await turnOffSuiteSync();

        expect(deps.dispatch).not.toHaveBeenCalled();
        expect(deps.getAllDeviceSessionIds).not.toHaveBeenCalled();
        expect(deps.turnOffSuiteSyncForWallet).not.toHaveBeenCalled();
        expect(deps.reloadApp).not.toHaveBeenCalled();
    });

    it('disables suite sync and turns off sync for all devices', async () => {
        const deps = createMockDeps<CreateTurnOffSuiteSyncDeps>({
            getIsSuiteSyncEnabled: () => true,
            dispatch: mock<Dispatch>(() => {}),
            getAllDeviceSessionIds: () => [deviceStaticSessionId1, deviceStaticSessionId2],
            turnOffSuiteSyncForWallet: () => Promise.resolve(),
            reloadApp: () => {},
        });

        const turnOffSuiteSync = createTurnOffSuiteSync(deps);
        await turnOffSuiteSync();

        expect(deps.dispatch).toHaveBeenCalledWith(updateSuiteSyncEnabled({ isEnabled: false }));
        expect(deps.turnOffSuiteSyncForWallet).toHaveBeenCalledWith({
            deviceStaticSessionId: deviceStaticSessionId1,
        });
        expect(deps.turnOffSuiteSyncForWallet).toHaveBeenCalledWith({
            deviceStaticSessionId: deviceStaticSessionId2,
        });
        expect(deps.dispatch).toHaveBeenCalledWith(clearAll());
        expect(deps.reloadApp).toHaveBeenCalled();
    });

    it('clears data and flushes storage even when no devices exist', async () => {
        const deps = createMockDeps<CreateTurnOffSuiteSyncDeps>({
            getIsSuiteSyncEnabled: () => true,
            dispatch: mock<Dispatch>(() => {}),
            getAllDeviceSessionIds: () => [],
            turnOffSuiteSyncForWallet: () => Promise.resolve(),
            reloadApp: () => {},
        });

        const turnOffSuiteSync = createTurnOffSuiteSync(deps);
        await turnOffSuiteSync();

        expect(deps.dispatch).toHaveBeenCalledWith(updateSuiteSyncEnabled({ isEnabled: false }));
        expect(deps.turnOffSuiteSyncForWallet).not.toHaveBeenCalled();
        expect(deps.dispatch).toHaveBeenCalledWith(clearAll());
        expect(deps.reloadApp).toHaveBeenCalled();
    });

    it('awaits ensure flushing of the storage', async () => {
        const deps = createMockDeps<CreateTurnOffSuiteSyncDeps>({
            getIsSuiteSyncEnabled: () => true,
            dispatch: mock<Dispatch>(() => {}),
            getAllDeviceSessionIds: () => [],
            turnOffSuiteSyncForWallet: () => Promise.resolve(),
            reloadApp: () => {},
        });

        const turnOffSuiteSync = createTurnOffSuiteSync(deps);
        let resolveFlushPromise = null as (() => void) | null;
        const flushPromise = new Promise<void>(resolve => {
            resolveFlushPromise = resolve;
        });
        const ensureFlushMock = jest.fn().mockImplementation(() => flushPromise);
        const turnOffPromise = turnOffSuiteSync({ ensureSettingsPersisted: ensureFlushMock });

        expect(ensureFlushMock).toHaveBeenCalled();
        expect(deps.reloadApp).not.toHaveBeenCalled();
        resolveFlushPromise?.();
        await flushPromise;
        expect(deps.reloadApp).toHaveBeenCalled();
        await turnOffPromise;
    });
});
