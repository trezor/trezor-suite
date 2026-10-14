import { isAutomationToolsEnabled } from '@suite/automation-tools';

import { type SuiteAutomationToolsDeps } from './registerSuiteAutomationToolsTypes';

/**
 * Loads the automation tools only with the gate on; a codesigned build never requests them.
 */
export async function loadSuiteAutomationTools(deps: SuiteAutomationToolsDeps) {
    if (!isAutomationToolsEnabled()) {
        return;
    }

    try {
        // A separate chunk keeps the tools out of the boot bundle.
        const { registerSuiteAutomationTools } = await import(
            /* webpackChunkName: "automation-tools" */ './registerSuiteAutomationTools'
        );

        registerSuiteAutomationTools(deps);
    } catch (error) {
        console.error('Suite automation tools failed to load', error);
    }
}
