import { PerfSample } from './collect';
import { syntheticUrl } from './identity';
import { LhciBuild, LhciClient, LhciProject } from './lhciClient';

/**
 * Pushes this run's samples to the LHCI server as one build. The upload is a side effect of the
 * report, never its precondition: every failure mode collapses into a status the caller prints,
 * and nothing here throws past the boundary.
 */

export type UploadOutcome =
    | { status: 'uploaded'; build: LhciBuild; runsUploaded: number }
    /** The (branch, hash) build already exists and is sealed — a re-run. Terminal by server design. */
    | { status: 'reused-sealed'; build: LhciBuild }
    | { status: 'skipped'; reason: string }
    | { status: 'failed'; reason: string };

export type UploadParams = {
    client: LhciClient;
    project: LhciProject;
    samples: PerfSample[];
    branch: string;
    hash: string;
    /** `git merge-base` with the base branch — the server links builds to ancestors by it. */
    ancestorHash: string;
    runUrl: string;
};

export const uploadSamples = async ({
    client,
    project,
    samples,
    branch,
    hash,
    ancestorHash,
    runUrl,
}: UploadParams): Promise<UploadOutcome> => {
    // Every retry is its own run on purpose: the server is built to hold N runs per (build, URL),
    // and medians over them is exactly what the delta wants.
    const uploadable = samples.filter(sample => sample.lhr !== null);
    if (uploadable.length === 0) {
        return { status: 'skipped', reason: 'no Lighthouse results among the samples' };
    }

    // The server's branch column is varchar(40); a longer PR branch name would fail the insert
    // outright, so it is truncated for the server while the report keeps the full name.
    const serverBranch = branch.slice(0, 40);

    try {
        const created = await client.createBuild(project.id, {
            branch: serverBranch,
            hash,
            ancestorHash,
            commitMessage: `${branch} @ ${hash.slice(0, 7)}`,
            author: 'suite-e2e perf <ci@trezor.io>',
            avatarUrl: '',
            externalBuildUrl: runUrl,
            runAt: new Date().toISOString(),
            committedAt: new Date().toISOString(),
        });

        // A duplicate (branch, hash) means a re-run: reuse the existing build — never suffix the
        // hash, that would fork history. Sealed means the previous run finished; adding runs is
        // rejected by the server, so this re-run's samples are deliberately not recorded.
        const build = created ?? (await client.findBuildByHash(project.id, serverBranch, hash));
        if (!build) {
            return { status: 'failed', reason: 'duplicate build reported but not found by hash' };
        }
        if (!created && build.lifecycle === 'sealed') {
            return { status: 'reused-sealed', build };
        }

        for (const sample of uploadable) {
            await client.postRun(
                project.id,
                build.id,
                syntheticUrl(sample),
                JSON.stringify(sample.lhr),
            );
        }

        await client.sealBuild(project.id, build.id);

        return { status: 'uploaded', build, runsUploaded: uploadable.length };
    } catch (error) {
        return { status: 'failed', reason: error instanceof Error ? error.message : String(error) };
    }
};
