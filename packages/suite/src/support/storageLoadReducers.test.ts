import { prepareSuiteSettingsReducer, suiteSettingsInitialState } from '@suite/settings';

import * as STORAGE from '#src/actions/suite/constants/storageConstants';

import { storageLoadReducers } from './storageLoadReducers';

const suiteSettingsReducer = prepareSuiteSettingsReducer({
    actionTypes: { storageLoad: STORAGE.LOAD },
    reducers: { storageLoadSuiteSettings: storageLoadReducers.storageLoadSuiteSettings },
});

const { transports: _transports, ...debugWithoutTransports } = suiteSettingsInitialState.debug;

const loadDebugSettings = (storedDebug: Record<string, unknown>) =>
    suiteSettingsReducer(suiteSettingsInitialState, {
        type: STORAGE.LOAD,
        payload: { suiteSettings: { settings: { debug: storedDebug } } },
    }).debug;

describe('storageLoadSuiteSettings', () => {
    it.each<{ description: string; storedTransports: Record<string, unknown> }>([
        { description: 'lack them', storedTransports: {} },
        { description: 'hold undefined', storedTransports: { transports: undefined } },
        { description: 'hold null', storedTransports: { transports: null } },
        { description: 'hold something else', storedTransports: { transports: 'BridgeTransport' } },
    ])(
        'keeps no debug transports when the stored settings $description',
        ({ storedTransports }) => {
            const storedDebug = {
                ...debugWithoutTransports,
                ...storedTransports,
                showConnectLogs: true,
            };

            expect(loadDebugSettings(storedDebug)).toEqual({
                ...suiteSettingsInitialState.debug,
                transports: [],
                showConnectLogs: true,
            });
        },
    );

    it('keeps the debug transports the stored settings hold', () => {
        expect(
            loadDebugSettings({ ...debugWithoutTransports, transports: ['BridgeTransport'] }),
        ).toEqual({ ...suiteSettingsInitialState.debug, transports: ['BridgeTransport'] });
    });
});
