import { type Lhr, type PerfSample } from './collect';
import { LhciClient, type LhciProject } from './lhciClient';
import { uploadSamples } from './upload';

const project: LhciProject = {
    id: 'p1',
    name: 'trezor-suite',
    slug: 'trezor-suite',
    baseBranch: 'develop',
};

const sample = (overrides: Partial<PerfSample> = {}): PerfSample => ({
    target: 'desktop',
    model: 'T3W1',
    scenario: 'account-switch',
    retry: 0,
    lhr: { audits: {} } as unknown as Lhr,
    perfMetrics: null,
    ...overrides,
});

const params = (client: Partial<LhciClient>, samples: PerfSample[]) => ({
    client: client as LhciClient,
    project,
    samples,
    branch: 'feat/x',
    hash: 'b'.repeat(40),
    ancestorHash: 'a'.repeat(40),
    runUrl: 'https://ci.example/run/1',
});

const freshBuild = { id: 'new-build', lifecycle: 'unsealed' as const };

describe('uploadSamples', () => {
    it('uploads every sample with an LHR as its own run, then seals', async () => {
        const client = {
            createBuild: jest.fn(() => Promise.resolve(freshBuild)),
            postRun: jest.fn(() => Promise.resolve(undefined)),
            sealBuild: jest.fn(() => Promise.resolve(undefined)),
        };

        const outcome = await uploadSamples(
            params(client as unknown as LhciClient, [
                sample(),
                sample({ retry: 1 }),
                sample({ scenario: 'timespan-died', lhr: null }),
            ]),
        );

        expect(outcome).toMatchObject({ status: 'uploaded', runsUploaded: 2 });
        expect(client.postRun).toHaveBeenCalledTimes(2);
        expect(client.postRun).toHaveBeenCalledWith(
            'p1',
            'new-build',
            'https://perf.suite.internal/desktop/T3W1/account-switch',
            expect.any(String),
        );
        expect(client.sealBuild).toHaveBeenCalledWith('p1', 'new-build');
    });

    // A sealed build rejects further runs by server design, so a re-run's samples are dropped —
    // loudly in the outcome, silently for the job.
    it('treats an already-sealed duplicate build as terminal', async () => {
        const client = {
            createBuild: jest.fn(() => Promise.resolve(null)),
            findBuildByHash: jest.fn(() =>
                Promise.resolve({ id: 'old-build', lifecycle: 'sealed' }),
            ),
            postRun: jest.fn(),
            sealBuild: jest.fn(),
        };

        const outcome = await uploadSamples(params(client as unknown as LhciClient, [sample()]));

        expect(outcome).toMatchObject({ status: 'reused-sealed', build: { id: 'old-build' } });
        expect(client.postRun).not.toHaveBeenCalled();
        expect(client.sealBuild).not.toHaveBeenCalled();
    });

    // An unsealed duplicate is a previous attempt that died before sealing — finish its job.
    it('resumes an unsealed duplicate build', async () => {
        const client = {
            createBuild: jest.fn(() => Promise.resolve(null)),
            findBuildByHash: jest.fn(() =>
                Promise.resolve({ id: 'half-done', lifecycle: 'unsealed' }),
            ),
            postRun: jest.fn(() => Promise.resolve(undefined)),
            sealBuild: jest.fn(() => Promise.resolve(undefined)),
        };

        const outcome = await uploadSamples(params(client as unknown as LhciClient, [sample()]));

        expect(outcome).toMatchObject({ status: 'uploaded', build: { id: 'half-done' } });
        expect(client.sealBuild).toHaveBeenCalledWith('p1', 'half-done');
    });

    it('skips when no sample carries an LHR', async () => {
        const outcome = await uploadSamples(params({} as LhciClient, [sample({ lhr: null })]));

        expect(outcome.status).toBe('skipped');
    });

    it('collapses any server failure into a failed outcome instead of throwing', async () => {
        const client = {
            createBuild: jest.fn(() =>
                Promise.reject(new Error('[lhci] POST /v1/projects/p1/builds → 500')),
            ),
        };

        const outcome = await uploadSamples(params(client as unknown as LhciClient, [sample()]));

        expect(outcome).toMatchObject({ status: 'failed' });
    });
});
