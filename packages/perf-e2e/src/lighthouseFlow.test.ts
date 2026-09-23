import {
    FLOW_DOCUMENT_KIND,
    LIGHTHOUSE_METRIC_PREFIX,
    buildFlowDocument,
    flowArtifactName,
    flowMetrics,
    isFlowDocument,
    stripFlowResult,
} from './lighthouseFlow';
import type { FlowResultLike } from './lighthouseFlow';

const lhr = () => ({
    requestedUrl: 'http://localhost:8000/',
    fullPageScreenshot: { screenshot: { data: 'data:image/webp;base64,AAAA'.repeat(500) } },
    audits: {
        'total-blocking-time': { numericValue: 611, displayValue: '611 ms' },
        'cumulative-layout-shift': { numericValue: 0.07 },
        'bootup-time': { numericValue: 940.26 },
        'final-screenshot': { details: { data: 'data:image/webp;base64,BBBB' } },
        'screenshot-thumbnails': { details: { items: [{ data: 'x' }, { data: 'y' }] } },
        'user-timings': {
            numericValue: 42,
            details: { items: new Array(1000).fill({ name: 'render', duration: 1 }) },
        },
        'network-requests': { details: { items: [{ url: 'http://localhost:8000/main.js' }] } },
    },
});

const flow = (): FlowResultLike => ({
    name: 'wallet discovery',
    steps: [
        { name: 'wallet-discovery', lhr: lhr() },
        { name: 'account-switch', lhr: lhr() },
    ],
});

describe('stripFlowResult', () => {
    it('drops the screenshot payloads, which are the bulk and the only wallet-visible part', () => {
        const [step] = stripFlowResult(flow()).steps ?? [];

        expect(step?.lhr?.fullPageScreenshot).toBeUndefined();
        expect(step?.lhr?.audits?.['final-screenshot']?.details).toBeUndefined();
        expect(step?.lhr?.audits?.['screenshot-thumbnails']?.details).toBeUndefined();
    });

    it('keeps the stripped audits present, because auditRefs still point at them', () => {
        const [step] = stripFlowResult(flow()).steps ?? [];

        // The report's renderer walks categories[].auditRefs and dereferences each id; a missing
        // audit makes the rendered page throw on load rather than merely omit a section.
        for (const id of ['final-screenshot', 'screenshot-thumbnails', 'user-timings']) {
            expect(step?.lhr?.audits?.[id]).toBeDefined();
        }
    });

    it('keeps the user-timings audit but not its unbounded details', () => {
        const [step] = stripFlowResult(flow()).steps ?? [];

        expect(step?.lhr?.audits?.['user-timings']).toEqual({ numericValue: 42 });
    });

    it('leaves every other audit and field untouched', () => {
        const [step] = stripFlowResult(flow()).steps ?? [];

        expect(step?.lhr?.requestedUrl).toBe('http://localhost:8000/');
        expect(step?.lhr?.audits?.['total-blocking-time']).toEqual({
            numericValue: 611,
            displayValue: '611 ms',
        });
        expect(step?.lhr?.audits?.['network-requests']).toEqual({
            details: { items: [{ url: 'http://localhost:8000/main.js' }] },
        });
    });

    it('strips every step, not just the first', () => {
        const stripped = stripFlowResult(flow());

        expect(stripped.steps?.every(step => step.lhr?.fullPageScreenshot === undefined)).toBe(
            true,
        );
    });

    it('does not mutate what it was given', () => {
        const original = flow();

        stripFlowResult(original);

        expect(original.steps?.[0]?.lhr?.fullPageScreenshot).toBeDefined();
    });

    it('is idempotent', () => {
        expect(stripFlowResult(stripFlowResult(flow()))).toEqual(stripFlowResult(flow()));
    });

    it('passes a document missing these fields through unharmed', () => {
        expect(stripFlowResult({ steps: [{ name: 'a' }] })).toEqual({ steps: [{ name: 'a' }] });
        expect(stripFlowResult({})).toEqual({});
    });
});

describe('flowMetrics', () => {
    it('namespaces the audits it reads', () => {
        expect(flowMetrics(lhr())).toMatchObject({
            [`${LIGHTHOUSE_METRIC_PREFIX}:total-blocking-time`]: 611,
            [`${LIGHTHOUSE_METRIC_PREFIX}:cumulative-layout-shift`]: 0.07,
            [`${LIGHTHOUSE_METRIC_PREFIX}:bootup-time`]: 940.26,
        });
    });

    it('reports an audit this run could not produce as null, not as missing', () => {
        expect(flowMetrics({ audits: {} })).toEqual({
            'lh:total-blocking-time': null,
            'lh:mainthread-work-breakdown': null,
            'lh:bootup-time': null,
            'lh:cumulative-layout-shift': null,
            'lh:total-byte-weight': null,
        });
    });

    it('treats a non-finite value as unmeasured', () => {
        expect(
            flowMetrics({ audits: { 'bootup-time': { numericValue: NaN } } })['lh:bootup-time'],
        ).toBeNull();
    });

    it('survives a step with no lhr at all', () => {
        expect(flowMetrics(undefined)['lh:total-blocking-time']).toBeNull();
    });
});

describe('buildFlowDocument', () => {
    const document = () =>
        buildFlowDocument({
            surface: 'web',
            model: 'T3W1',
            title: 'wallet discovery',
            retry: 0,
            flow: flow(),
            generatedAt: '2026-09-22T08:00:00.000Z',
        });

    it('carries one step per recorded timespan, named by its scenario', () => {
        expect(document().steps.map(step => step.scenario)).toEqual([
            'wallet-discovery',
            'account-switch',
        ]);
    });

    it('stores the stripped flow, not the original', () => {
        expect(document().flow.steps?.[0]?.lhr?.fullPageScreenshot).toBeUndefined();
    });

    it('is recognisable beside a history document', () => {
        expect(isFlowDocument(document())).toBe(true);
        expect(isFlowDocument({ surface: 'web', measurements: [] })).toBe(false);
        expect(isFlowDocument(null)).toBe(false);
    });

    it('stamps the kind so the publisher can tell the two apart', () => {
        expect(document().kind).toBe(FLOW_DOCUMENT_KIND);
    });
});

describe('flowArtifactName', () => {
    const named = (title: string, model: string, retry: number) =>
        flowArtifactName(
            buildFlowDocument({ surface: 'web', model, title, retry, flow: { steps: [] } }),
        );

    it('survives a title a key cannot carry', () => {
        expect(named('Discovery > wallet/accounts', 'T3W1', 0)).toBe(
            'flow-Discovery-wallet__accounts-T3W1-0',
        );
    });

    it('keeps two device models of one title apart', () => {
        expect(named('wallet discovery', 'T3W1', 0)).not.toBe(named('wallet discovery', 'T3T1', 0));
    });

    it('keeps a retry from overwriting the attempt before it', () => {
        expect(named('wallet discovery', 'T3W1', 1)).not.toBe(named('wallet discovery', 'T3W1', 0));
    });
});
