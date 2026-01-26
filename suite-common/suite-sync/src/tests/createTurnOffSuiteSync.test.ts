import type { Dispatch } from '@reduxjs/toolkit';

import type { StaticSessionId } from '@trezor/connect';

import { createMockDeps, mock } from '../../tests/utils';
import { CreateTurnOffSuiteSyncDeps, createTurnOffSuiteSync } from '../createTurnOffSuiteSync';
import { clearAll } from '../data/suiteSyncDataReducer';
import { suiteSyncActions } from '../suiteSyncActions';

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

        expect(deps.dispatch).toHaveBeenCalledWith(
            suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: false }),
        );
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

        expect(deps.dispatch).toHaveBeenCalledWith(
            suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: false }),
        );
        expect(deps.turnOffSuiteSyncForWallet).not.toHaveBeenCalled();
        expect(deps.dispatch).toHaveBeenCalledWith(clearAll());
        expect(deps.reloadApp).toHaveBeenCalled();
    });
});
