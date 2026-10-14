import { createAutomationTools, registerToolDiscovery } from '@suite/automation-tools';
import { selectDeviceThunk } from '@suite-common/device';

import { createEmptyStoragePayload } from 'src/storage/createEmptyStoragePayload';

import { createSeedStorage } from './createSeedStorage';
import { type SuiteAutomationToolsDeps } from './registerSuiteAutomationToolsTypes';

/**
 * Registers the gated `suite` tool group for chrome-devtools-mcp and any other consumer. Returns
 * the function that removes the listener again.
 */
export const registerSuiteAutomationTools = ({
    store,
    connect,
    desktopApi,
    history,
}: SuiteAutomationToolsDeps) =>
    registerToolDiscovery(
        createAutomationTools({
            store,
            services: {
                store,
                connect,
                desktopApi,
                history,
            },
            getStorageDefaults: createEmptyStoragePayload,
            seedStorage: createSeedStorage({
                dispatch: store.dispatch,
                getState: store.getState,
                selectDevice: device => store.dispatch(selectDeviceThunk({ device })),
            }),
            document,
        }),
    );
