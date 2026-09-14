/**
 * What identifies a measurement across the whole delta pipeline: the LHCI server keys everything by
 * URL, so each (target, model, scenario) gets a stable synthetic one. The registry below is the
 * single place that says which numbers the report reads and when a delta is worth flagging.
 */

export type SampleIdentity = {
    /** `web` or `desktop` — kept as string so an unexpected target degrades to an odd row, not a crash. */
    target: string;
    /** Playwright project name (T3W1, T3T1, …), the same value budget keying uses. */
    model: string;
    /** The name a test passes to `perf.measure` (or its title in whole-test mode). */
    scenario: string;
};

const SYNTHETIC_ORIGIN = 'https://perf.suite.internal';

/** The same replacement perfMeasure applies to file names; URLs get no free sanitizing either. */
export const sanitizeScenario = (scenario: string) => scenario.replace(/[^\w-]+/g, '-');

export const measurementId = ({ target, model, scenario }: SampleIdentity) =>
    `${target}/${model}/${sanitizeScenario(scenario)}`;

/** Where the server files this measurement. The server caps `runs.url` at 256 chars. */
export const syntheticUrl = (identity: SampleIdentity) =>
    `${SYNTHETIC_ORIGIN}/${measurementId(identity)}`.slice(0, 256);

export const parseSyntheticUrl = (url: string): SampleIdentity | null => {
    if (!url.startsWith(`${SYNTHETIC_ORIGIN}/`)) {
        return null;
    }

    const [target, model, ...scenario] = url.slice(SYNTHETIC_ORIGIN.length + 1).split('/');
    if (!target || !model || scenario.length === 0) {
        return null;
    }

    return { target, model, scenario: scenario.join('/') };
};

export type MetricUnit = 'ms' | 'count' | 'bytes' | 'unitless';

export type ReportMetric = {
    /** The audit the value is read from; `trezor-*` ones are injected by syntheticAudits. */
    auditId: string;
    label: string;
    unit: MetricUnit;
    /**
     * Both floors must trip before a delta is flagged, so one noisy run cannot paint the report
     * red: the relative floor filters small drift on big numbers, the absolute floor filters big
     * percentages on tiny ones. `null` relative floor means only the absolute one applies.
     * Lower is always better. Tune from server data once a few weeks of it exist.
     */
    relativeFloor: number | null;
    absoluteFloor: number;
};

export const REPORT_METRICS: ReportMetric[] = [
    {
        auditId: 'total-blocking-time',
        label: 'Total Blocking Time',
        unit: 'ms',
        relativeFloor: 0.15,
        absoluteFloor: 100,
    },
    {
        auditId: 'mainthread-work-breakdown',
        label: 'Main-thread work',
        unit: 'ms',
        relativeFloor: 0.15,
        absoluteFloor: 250,
    },
    {
        auditId: 'bootup-time',
        label: 'Script bootup',
        unit: 'ms',
        relativeFloor: 0.15,
        absoluteFloor: 150,
    },
    {
        auditId: 'trezor-interaction-duration',
        label: 'Interaction duration',
        unit: 'ms',
        relativeFloor: 0.1,
        absoluteFloor: 250,
    },
    {
        auditId: 'trezor-react-commit-count',
        label: 'React commits',
        unit: 'count',
        relativeFloor: 0.1,
        absoluteFloor: 10,
    },
    {
        auditId: 'trezor-long-task-count',
        label: 'Long tasks',
        unit: 'count',
        relativeFloor: 0.2,
        absoluteFloor: 3,
    },
    {
        auditId: 'cumulative-layout-shift',
        label: 'Cumulative Layout Shift',
        unit: 'unitless',
        relativeFloor: null,
        absoluteFloor: 0.02,
    },
    {
        auditId: 'total-byte-weight',
        label: 'Byte weight',
        unit: 'bytes',
        relativeFloor: 0.05,
        absoluteFloor: 100 * 1024,
    },
];
