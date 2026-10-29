import type { Octokit } from '@octokit/rest';

// This job runs before Yarn install. Node loads the TypeScript files directly.
import { ghView, loadLinkedNumbersFrom, parseTarget } from './target.ts';

type PullRequest = {
    number: number;
    headRefOid: string;
    isCrossRepository: boolean;
};

type ResolveDesktopBuildParams = {
    github: Pick<Octokit, 'rest'>;
    context: { repo: { owner: string; repo: string } };
    core: { setOutput: (name: string, value: string | number) => void };
};

export const resolveDesktopBuild = async ({
    github,
    context,
    core,
}: ResolveDesktopBuildParams): Promise<void> => {
    const target = parseTarget(process.env.TARGET);
    let prNumber = target.number;

    if (target.kind === 'issue') {
        const linkedPrNumbers = loadLinkedNumbersFrom('issue', target.number);
        if (linkedPrNumbers.length === 0) {
            throw new Error('Issue has no linked Suite PR');
        }

        // When an issue links to several PRs, test the most recently opened one.
        prNumber = Math.max(...linkedPrNumbers);
    }

    const pr = ghView<PullRequest>('pr', prNumber, 'number,headRefOid,isCrossRepository');
    if (pr.isCrossRepository) {
        throw new Error('Desktop testing of fork PRs is not supported');
    }

    core.setOutput('head-sha', pr.headRefOid);

    const workflowRunsResponse = await github.rest.actions.listWorkflowRuns({
        ...context.repo,
        workflow_id: 'test-suite-web-desktop-e2e-pr.yml',
        head_sha: pr.headRefOid,
        per_page: 1,
    });
    const latestRun = workflowRunsResponse.data.workflow_runs[0];
    if (!latestRun) {
        // Without a run-id output, the workflow builds the app from head-sha.
        return;
    }

    const artifactsResponse = await github.rest.actions.listWorkflowRunArtifacts({
        ...context.repo,
        run_id: latestRun.id,
        name: 'desktop-app-build-e2e',
    });
    const hasAvailableBuild = artifactsResponse.data.artifacts.some(artifact => !artifact.expired);
    if (hasAvailableBuild) {
        core.setOutput('run-id', latestRun.id);
    }
};
