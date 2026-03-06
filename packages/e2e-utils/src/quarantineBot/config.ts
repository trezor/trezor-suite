export const CURRENTS_API_BASE = 'https://api.currents.dev/v1';
export const AUTO_QUARANTINE_PREFIX = '[auto-quarantine]';

/**
 * Heuristic thresholds
 */
export const QUARANTINE_FAILURE_RATE = 0.6; // quarantine if ≥60% fails in the last N executions
export const QUARANTINE_LAST_N_EXECUTIONS = 5; // number of individual executions to evaluate
export const UNQUARANTINE_FAILURE_RATE = 0; // unquarantine if test becomes perfectly stable (0% failures in the last N executions)
export const UNQUARANTINE_LAST_N_EXECUTIONS = 25; // number of individual executions to evaluate
export const EXPLORER_LOOKBACK_DAYS = 2; // window used by Tests Explorer to discover active tests
// Pre-filter: skip only tests that are nearly perfect (>98% pass rate) in the explorer window.
// Any test with ≥2% failure rate in the aggregate metrics is worth inspecting individually.
// The exact quarantine decision is still made on the precise last-N execution results.
export const PRE_FILTER_FAILURE_RATE = 0.02; // inspect anything that isn't close to 100% passing
export const TEST_RESULTS_PAGE_SIZE = 10; // default page size of the test-results API endpoint
export const DEVELOP_BRANCH = 'develop';
export const SLACK_TITLE_MAX_LENGTH = 50;

export const PROJECTS: Array<{ id: string; label: string }> = [
    { id: 'Og0NOQ', label: 'Trezor Suite (web)' },
    { id: '4ytF0E', label: 'Trezor Suite (desktop)' },
    //{ id: 'iBEsWE', label: 'Experimental Playground' },
];
