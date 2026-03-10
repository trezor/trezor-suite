export { CURRENTS_API_BASE, DEVELOP_BRANCH, TEST_RESULTS_PAGE_SIZE } from '../currentsApi/config';

export const EXPLORER_LOOKBACK_DAYS = 2; // window used by Tests Explorer to discover active tests

export const AUTO_QUARANTINE_PREFIX = '[auto-quarantine]';

/**
 * Heuristic thresholds
 */
export const QUARANTINE_FAILURE_RATE = 0.6; // quarantine if ≥60% fails in the last N executions
export const QUARANTINE_LAST_N_EXECUTIONS = 5; // number of individual executions to evaluate
export const UNQUARANTINE_FAILURE_RATE = 0; // unquarantine if test becomes perfectly stable (0% failures in the last N executions)
export const UNQUARANTINE_LAST_N_EXECUTIONS = 25; // number of individual executions to evaluate
// Pre-filter: skip only tests that are nearly perfect (>98% pass rate) in the explorer window.
// Any test with ≥2% failure rate in the aggregate metrics is worth inspecting individually.
// The exact quarantine decision is still made on the precise last-N execution results.
export const PRE_FILTER_FAILURE_RATE = 0.02; // inspect anything that isn't close to 100% passing
export const SLACK_TITLE_MAX_LENGTH = 50;

export const PROJECTS: Array<{ id: string; name: string; label: string }> = [
    { id: 'Og0NOQ', name: 'web', label: 'Trezor Suite (web)' },
    { id: '4ytF0E', name: 'desktop', label: 'Trezor Suite (desktop)' },
    //{ id: 'iBEsWE', name: 'playground', label: 'Experimental Playground' },
];
