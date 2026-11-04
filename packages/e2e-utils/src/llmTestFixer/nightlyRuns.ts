import { currentsRequest, getRunsOnBranch } from '../currentsApi/api';
import { DEVELOP_BRANCH } from '../currentsApi/config';
import type { RunCompletionState, RunListItem, RunResponse } from '../currentsApi/types';

const NIGHTLY_PROJECT_IDS = {
    web: 'Og0NOQ',
    desktop: '4ytF0E',
} as const;
const NIGHTLY_TAG = 'nightly';
const RECENT_RUNS_LIMIT = 5;
const EXCLUDED_SPEC_PREFIX = 'trading-live/';
const FINISHED_COMPLETION_STATES: RunCompletionState[] = ['COMPLETE', 'TIMEOUT'];

type NightlyPlatform = keyof typeof NIGHTLY_PROJECT_IDS;

type PlatformCheck = { runId: string } | { problem: string };

export type NightlyRunsCheck =
    { isClean: true; webRunId: string; desktopRunId: string } | { isClean: false; reason: string };

async function findLatestNightlyRun(platform: NightlyPlatform): Promise<RunListItem | undefined> {
    const runs = await getRunsOnBranch({
        projectId: NIGHTLY_PROJECT_IDS[platform],
        branch: DEVELOP_BRANCH,
        tag: NIGHTLY_TAG,
        limit: RECENT_RUNS_LIMIT,
    });
    // Must match currents-ci-build-id in test-suite-web-desktop-e2e-nightly.yml, which canary runs do not.
    const ciBuildIdPrefix = `nightly-${platform}-run-`;

    return runs
        .filter(run => run.meta.ciBuildId.startsWith(ciBuildIdPrefix))
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
        .at(0);
}

async function countFailingSpecs(runId: string): Promise<number> {
    const { data: run } = await currentsRequest<RunResponse>(`/runs/${runId}`);

    return run.specs.filter(spec => {
        const stats = spec.results?.stats;
        // Quarantined failures are reported as pending.
        const hasFailedTests = (stats?.failures ?? 0) > 0 || (stats?.pending ?? 0) > 0;

        return hasFailedTests && !spec.spec.startsWith(EXCLUDED_SPEC_PREFIX);
    }).length;
}

async function checkPlatform(platform: NightlyPlatform): Promise<PlatformCheck> {
    const run = await findLatestNightlyRun(platform);

    if (!run) {
        return { problem: `no ${platform} nightly run found` };
    }

    if (!FINISHED_COMPLETION_STATES.includes(run.completionState)) {
        return { problem: `${platform} run ${run.runId} is ${run.completionState}` };
    }

    const failingSpecCount = await countFailingSpecs(run.runId);

    if (failingSpecCount > 0) {
        return {
            problem: `${platform} run ${run.runId} has ${failingSpecCount} failing or pending specs`,
        };
    }

    return { runId: run.runId };
}

export async function checkNightlyRuns(): Promise<NightlyRunsCheck> {
    try {
        const [web, desktop] = await Promise.all([checkPlatform('web'), checkPlatform('desktop')]);

        if ('problem' in web) {
            return { isClean: false, reason: web.problem };
        }

        if ('problem' in desktop) {
            return { isClean: false, reason: desktop.problem };
        }

        return { isClean: true, webRunId: web.runId, desktopRunId: desktop.runId };
    } catch (e) {
        return {
            isClean: false,
            reason: `Currents API request failed: ${e instanceof Error ? e.message : e}`,
        };
    }
}
