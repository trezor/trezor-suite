import { events } from '@suite/analytics';
import { type SuiteSyncDesktopFactoryDeps, suiteSyncErrorHandler } from '@suite/suite-sync';
import { selectIsTorEnabled } from '@suite/tor';
import { createSuiteSyncCompositionRoot } from '@suite-common/suite-sync';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { createMockDeps, mock } from '@trezor/dependency-injection';

import { createSuiteSyncDesktopCompositionRoot } from './createSuiteSyncDesktopCompositionRoot';
import { type EvoluDeps, createEvoluDeps } from './evolu/createEvoluDeps';

jest.mock('@suite/analytics', () => ({
    events: {
        settingsGeneralLabelingProviderEvent: { name: 'settings/general/labeling-provider' },
    },
}));
jest.mock('@suite/suite-sync', () => ({ suiteSyncErrorHandler: jest.fn() }));
jest.mock('@suite/tor', () => ({ selectIsTorEnabled: jest.fn() }));
jest.mock('@suite-common/suite-sync', () => ({
    createSuiteSyncCompositionRoot: jest.fn(),
    createUpdateRelayConnectionStatus: jest.fn(),
}));
jest.mock('@suite-common/suite-sync-evolu', () => ({
    evoluCreateSuiteSyncOwner: jest.fn(),
}));
jest.mock('./evolu/createEvoluDeps', () => ({ createEvoluDeps: jest.fn() }));

const createDeps = () =>
    createMockDeps<SuiteSyncDesktopFactoryDeps>({
        getState: () => ({}),
        dispatch: null,
        onStorageEnsured: null,
        getTrezorConnect: null,
        platformEncryption: { encrypt: null, decrypt: null },
        ensureDelegatedIdentityKey: null,
        analytics: { report: () => undefined },
        fetch: null,
    });

describe('createSuiteSyncDesktopCompositionRoot', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(createSuiteSyncCompositionRoot).mockReturnValue(mockSuiteSync());
        jest.mocked(createEvoluDeps).mockReturnValue(
            createMockDeps<EvoluDeps>({ createSuiteStorage: null, subscribeError: null }),
        );
    });

    it('uses the host dependencies and preserves the storage migration callback', () => {
        const deps = createDeps();

        createSuiteSyncDesktopCompositionRoot(deps);

        expect(createSuiteSyncCompositionRoot).toHaveBeenCalledWith(
            expect.objectContaining({
                dispatch: deps.dispatch,
                platformEncryption: deps.platformEncryption,
                getTrezorConnect: deps.getTrezorConnect,
                ensureDelegatedIdentityKey: deps.ensureDelegatedIdentityKey,
                onStorageEnsured: deps.onStorageEnsured,
                analytics: deps.analytics,
                fetch: deps.fetch,
            }),
        );
    });

    it('reads the current Tor setting when the service requests it', () => {
        const deps = createDeps();
        createSuiteSyncDesktopCompositionRoot(deps);
        const [compositionDeps] = jest.mocked(createSuiteSyncCompositionRoot).mock.calls[0]!;

        jest.mocked(selectIsTorEnabled).mockReturnValueOnce(false).mockReturnValueOnce(true);

        expect(compositionDeps.getIsTorEnabled()).toBe(false);
        expect(compositionDeps.getIsTorEnabled()).toBe(true);
        expect(deps.getState).toHaveBeenCalledTimes(2);
    });

    it('routes uncontrolled errors to the reusable UI error handler', () => {
        const deps = createDeps();
        createSuiteSyncDesktopCompositionRoot(deps);
        const [compositionDeps] = jest.mocked(createSuiteSyncCompositionRoot).mock.calls[0]!;
        const error = { type: 'DeviceNotConnectedError' } as const;

        compositionDeps.suiteSyncUncontrolledErrorHandler({ device: null, error });

        expect(suiteSyncErrorHandler).toHaveBeenCalledWith({
            error,
            dispatch: deps.dispatch,
            deviceStaticSessionId: null,
        });
    });

    it('reports the desktop provider and delegates enabling to the composed service', async () => {
        const deps = createDeps();
        const commonSuiteSync = mockSuiteSync();
        const turnOnSuiteSync = mock<typeof commonSuiteSync.turnOnSuiteSync>(
            commonSuiteSync.turnOnSuiteSync,
        );
        jest.mocked(createSuiteSyncCompositionRoot).mockReturnValue({
            ...commonSuiteSync,
            turnOnSuiteSync,
        });
        const suiteSync = createSuiteSyncDesktopCompositionRoot(deps);
        const params = { deviceStaticSessionId: undefined };

        await suiteSync.turnOnSuiteSync(params);

        expect(deps.analytics.report).toHaveBeenCalledWith({
            type: events.settingsGeneralLabelingProviderEvent.name,
            payload: { provider: 'evolu' },
        });
        expect(turnOnSuiteSync).toHaveBeenCalledWith(params);
        expect(suiteSync.labeling).toBe(commonSuiteSync.labeling);
    });
});
