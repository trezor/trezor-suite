import { checkRecommendedQuarantine } from './quarantine';
import * as currentsApi from '../currentsApi/api';
import type { Action, TestExplorerItem } from '../currentsApi/types';

const makeAction = (overrides: Partial<Action> = {}): Action => ({
    actionId: 'action',
    name: '[auto-quarantine] Wallet > Send',
    description: 'Spec: tests/wallet/send.test.ts',
    status: 'active',
    createdAt: '2026-10-21T00:00:00Z',
    action: [{ op: 'quarantine' }],
    matcher: { op: 'AND', cond: [{ type: 'titlePath', op: 'incAll', value: ['Wallet', 'Send'] }] },
    ...overrides,
});

const makeTest = (spec: string): TestExplorerItem => ({
    spec,
    title: 'Wallet > Send',
    titlePath: ['Wallet', 'Send'],
    metrics: {
        executions: 1,
        failures: 1,
        passes: 0,
        failureRate: 1,
        flakinessRate: 0,
        flaky: 0,
        ignored: 0,
        avgDurationMs: 0,
        flakinessVolume: 0,
        failureVolume: 1,
        durationVolume: 0,
    },
});

const recommendedTests = ['suite/e2e/tests/wallet/send.test.ts'];

const originalApiKey = process.env.CURRENTS_API_KEY;

beforeEach(() => {
    process.env.CURRENTS_API_KEY = 'test-key';
    jest.spyOn(currentsApi, 'getAllQuarantineActions').mockResolvedValue([]);
    jest.spyOn(currentsApi, 'getActiveTests').mockResolvedValue([]);
});

afterEach(() => {
    jest.restoreAllMocks();
    if (originalApiKey === undefined) delete process.env.CURRENTS_API_KEY;
    else process.env.CURRENTS_API_KEY = originalApiKey;
});

it('reports only quarantines in recommended specs, separately for web and desktop', async () => {
    jest.mocked(currentsApi.getAllQuarantineActions).mockResolvedValue([
        makeAction(),
        makeAction({ actionId: 'unrelated', description: 'Spec: tests/other/send.test.ts' }),
    ]);
    const result = await checkRecommendedQuarantine(recommendedTests);
    expect(result.tests).toEqual([
        { project: 'Trezor Suite (web)', spec: recommendedTests[0], test: 'Wallet > Send' },
        { project: 'Trezor Suite (desktop)', spec: recommendedTests[0], test: 'Wallet > Send' },
    ]);
    expect(result.unavailableProjects).toEqual([]);
    expect(result.unresolvedActions).toBe(0);
    expect(currentsApi.getActiveTests).not.toHaveBeenCalled();
});

it('resolves manual title-only rules through the explorer and excludes other specs', async () => {
    jest.mocked(currentsApi.getAllQuarantineActions).mockResolvedValue([
        makeAction({ name: 'manual', description: '' }),
    ]);
    jest.mocked(currentsApi.getActiveTests)
        .mockResolvedValueOnce([makeTest('tests/wallet/send.test.ts')])
        .mockResolvedValueOnce([makeTest('tests/other/send.test.ts')]);
    const result = await checkRecommendedQuarantine(recommendedTests);
    expect(result.tests).toEqual([
        { project: 'Trezor Suite (web)', spec: recommendedTests[0], test: 'Wallet > Send' },
    ]);
    expect(result.unresolvedActions).toBe(0);
});

it('supports explicit spec rules and deduplicates overlapping quarantine actions', async () => {
    const action = makeAction({
        name: 'manual',
        description: '',
        matcher: {
            op: 'AND',
            cond: [{ type: 'spec', op: 'eq', value: './tests/wallet/send.test.ts' }],
        },
    });
    jest.mocked(currentsApi.getAllQuarantineActions).mockResolvedValue([action, action]);
    const result = await checkRecommendedQuarantine(recommendedTests);
    expect(result.tests).toHaveLength(2);
    expect(result.tests[0]?.test).toBe('manual');
});

it('resolves a single title-path condition with an OR matcher', async () => {
    jest.mocked(currentsApi.getAllQuarantineActions).mockResolvedValue([
        makeAction({
            name: 'manual',
            description: '',
            matcher: { op: 'OR', cond: [{ type: 'titlePath', op: 'incAll', value: ['Send'] }] },
        }),
    ]);
    jest.mocked(currentsApi.getActiveTests).mockResolvedValue([
        makeTest('tests/wallet/send.test.ts'),
    ]);
    expect((await checkRecommendedQuarantine(recommendedTests)).tests).toHaveLength(2);
});

it('does not mistake unavailable credentials for an empty quarantine', async () => {
    delete process.env.CURRENTS_API_KEY;
    const result = await checkRecommendedQuarantine(recommendedTests);
    expect(result.tests).toEqual([]);
    expect(result.unavailableProjects).toEqual(['Trezor Suite (web)', 'Trezor Suite (desktop)']);
    expect(currentsApi.getAllQuarantineActions).not.toHaveBeenCalled();
});

it('keeps successful project results when another project request fails', async () => {
    jest.mocked(currentsApi.getAllQuarantineActions)
        .mockResolvedValueOnce([makeAction()])
        .mockRejectedValueOnce(new Error('unavailable'));
    const result = await checkRecommendedQuarantine(recommendedTests);
    expect(result.tests).toHaveLength(1);
    expect(result.unavailableProjects).toEqual(['Trezor Suite (desktop)']);
});

it('marks unresolved or unsupported rules as incomplete instead of guessing relevance', async () => {
    jest.mocked(currentsApi.getAllQuarantineActions).mockResolvedValue([
        makeAction({ name: 'manual', description: '', matcher: { op: 'OR', cond: [] } }),
    ]);
    const result = await checkRecommendedQuarantine(recommendedTests);
    expect(result.tests).toEqual([]);
    expect(result.unresolvedActions).toBe(2);
});

it('skips API requests when no tests were recommended', async () => {
    expect((await checkRecommendedQuarantine([])).tests).toEqual([]);
    expect(currentsApi.getAllQuarantineActions).not.toHaveBeenCalled();
});

it('does not interpret exact title-path rules as partial matches', async () => {
    jest.mocked(currentsApi.getAllQuarantineActions).mockResolvedValue([
        makeAction({
            name: 'manual',
            description: '',
            matcher: { op: 'AND', cond: [{ type: 'titlePath', op: 'eq', value: ['Wallet'] }] },
        }),
    ]);
    jest.mocked(currentsApi.getActiveTests).mockResolvedValue([
        makeTest('tests/wallet/send.test.ts'),
    ]);
    const result = await checkRecommendedQuarantine(recommendedTests);
    expect(result.tests).toEqual([]);
    expect(result.unresolvedActions).toBe(2);
});

it('retains known matches and marks the project unavailable when explorer lookup fails', async () => {
    jest.mocked(currentsApi.getAllQuarantineActions).mockResolvedValue([
        makeAction(),
        makeAction({ name: 'manual', description: '' }),
    ]);
    jest.mocked(currentsApi.getActiveTests).mockRejectedValue(new Error('unavailable'));
    const result = await checkRecommendedQuarantine(recommendedTests);
    expect(result.tests).toHaveLength(2);
    expect(result.unavailableProjects).toHaveLength(2);
});
