import type { Octokit } from '@octokit/rest';
import { createRequire } from 'node:module';

import type * as targetHelpers from './target';

// The gate runs before dependencies are installed, so Node loads the TypeScript source directly.
const { ghView, loadLinkedNumbersFrom, parseTarget }: typeof targetHelpers = createRequire(
    import.meta.url,
)('./target.ts');

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
    const numbers =
        target.kind === 'pr' ? [target.number] : loadLinkedNumbersFrom('issue', target.number);
    if (!numbers.length) throw new Error('Issue has no linked Suite PR');

    const pr = ghView<PullRequest>(
        'pr',
        Math.max(...numbers),
        'number,headRefOid,isCrossRepository',
    );
    if (pr.isCrossRepository) throw new Error('Desktop testing of fork PRs is not supported');
    core.setOutput('head-sha', pr.headRefOid);
    core.setOutput('build-target', `${pr.number}:${pr.headRefOid}`);

    const {
        data: {
            workflow_runs: [run],
        },
    } = await github.rest.actions.listWorkflowRuns({
        ...context.repo,
        workflow_id: 'test-suite-web-desktop-e2e-pr.yml',
        head_sha: pr.headRefOid,
        event: 'pull_request',
        per_page: 1,
    });
    if (!run) return;

    const {
        data: { artifacts },
    } = await github.rest.actions.listWorkflowRunArtifacts({
        ...context.repo,
        run_id: run.id,
        name: 'desktop-app-build-e2e',
    });
    if (artifacts.some(artifact => !artifact.expired)) core.setOutput('run-id', run.id);
};
