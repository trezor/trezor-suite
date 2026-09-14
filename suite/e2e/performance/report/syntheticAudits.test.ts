import { readFileSync } from 'fs';
import { join } from 'path';

import { type PerfMetrics } from '@trezor/perf-e2e';

import { type Lhr } from './collect';
import { COMPONENT_RENDER_COUNTS_AUDIT_ID, augmentLhr } from './syntheticAudits';

// A trimmed real timespan LHR (account-switch on T3W1): 12 user-timing measures, of which
// FloatingPortal rendered 3×.
const fixtureLhr = (): Lhr =>
    JSON.parse(
        readFileSync(join(__dirname, '__fixtures__', 'account-switch.lhr.json'), 'utf8'),
    ) as Lhr;

const metrics = (overrides: Partial<PerfMetrics> = {}): PerfMetrics => ({
    totalBlockingTimeMs: 672,
    longTaskCount: 4,
    longestTaskMs: 210,
    reactCommitCount: 35,
    interactionDurationMs: 696,
    ...overrides,
});

describe('augmentLhr', () => {
    it('injects the in-page metrics as informative trezor-* audits', () => {
        const augmented = augmentLhr(fixtureLhr(), metrics());

        expect(augmented.audits['trezor-react-commit-count']?.numericValue).toBe(35);
        expect(augmented.audits['trezor-interaction-duration']?.numericValue).toBe(696);
        expect(augmented.audits['trezor-long-task-count']?.numericValue).toBe(4);
        expect(augmented.audits['trezor-longest-task']?.numericValue).toBe(210);
        expect(augmented.audits['trezor-total-blocking-time-inpage']?.numericValue).toBe(672);
        expect(augmented.audits['trezor-interaction-duration']?.scoreDisplayMode).toBe(
            'informative',
        );
    });

    // A metric the environment could not measure must stay absent — injecting it as 0 would trend.
    it('omits a metric measured as null', () => {
        const augmented = augmentLhr(fixtureLhr(), metrics({ longestTaskMs: null }));

        expect(augmented.audits['trezor-longest-task']).toBeUndefined();
        expect(augmented.audits['trezor-long-task-count']).toBeDefined();
    });

    it('injects no trezor audits without in-page metrics, but still strips', () => {
        const augmented = augmentLhr(fixtureLhr(), null);

        expect(augmented.audits['trezor-react-commit-count']).toBeUndefined();
        expect(augmented.audits['user-timings']?.details).toBeUndefined();
    });

    it('strips user-timings details but keeps the audit shell', () => {
        const augmented = augmentLhr(fixtureLhr(), metrics());
        const shell = augmented.audits['user-timings'];

        expect(shell?.details).toBeUndefined();
        expect(shell?.id).toBe('user-timings');
        expect(shell?.displayValue).toContain('user timing');
    });

    it('aggregates the top component render counts before stripping', () => {
        const augmented = augmentLhr(fixtureLhr(), metrics());
        const aggregate = augmented.audits[COMPONENT_RENDER_COUNTS_AUDIT_ID];
        const { items } = aggregate?.details as unknown as {
            items: Array<{ name: string; count: number }>;
        };

        expect(aggregate?.numericValue).toBe(12);
        expect(items[0]?.count).toBe(3);
        expect(items[0]?.name).toContain('FloatingPortal');
    });

    // The server's UI and statistics enumerate a category's auditRefs, never the audits map — an
    // audit missing from every category would be stored but invisible.
    it('references the injected audits from the performance category with zero weight', () => {
        const augmented = augmentLhr(fixtureLhr(), metrics());
        const refs = augmented.categories.performance?.auditRefs ?? [];
        const trezorRefs = refs.filter(ref => ref.id.startsWith('trezor-'));

        expect(trezorRefs.map(ref => ref.id)).toContain('trezor-react-commit-count');
        expect(trezorRefs.map(ref => ref.id)).toContain(COMPONENT_RENDER_COUNTS_AUDIT_ID);
        expect(trezorRefs.every(ref => ref.weight === 0)).toBe(true);
        expect(augmented.categories.performance?.score).toBe(
            fixtureLhr().categories.performance?.score,
        );
    });

    it('leaves the input LHR untouched', () => {
        const original = fixtureLhr();
        augmentLhr(original, metrics());

        expect(original.audits['user-timings']?.details).toBeDefined();
        expect(original.audits['trezor-react-commit-count']).toBeUndefined();
    });
});
