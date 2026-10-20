import { type SuiteAutomationToolsDeps } from './registerSuiteAutomationToolsTypes';

export async function loadSuiteAutomationTools(deps: SuiteAutomationToolsDeps) {
    try {
        // A chunk of its own: the automation tools and what only they need stay out of the boot
        // bundle of a real user's session.
        const { registerSuiteAutomationTools } = await import(
            /* webpackChunkName: "automation-tools" */ 'src/support/automation/registerSuiteAutomationTools'
        );

        registerSuiteAutomationTools(deps);
    } catch (error) {
        console.error('Suite automation tools failed to load', error);
    }
}
