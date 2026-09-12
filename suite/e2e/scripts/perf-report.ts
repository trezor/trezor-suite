/**
 * Builds the per-scenario performance delta report from e2e perf artifacts, uploads the samples to
 * the LHCI server, or both — depending on the mode:
 *
 *   --mode ci-pr        upload + report file for the PR description (+ step summary)
 *   --mode ci-baseline  upload + seal only, step summary (the nightly develop baseline)
 *   --mode local        report from local test-results against the server baseline, no upload
 *
 * Flags: --artifacts <dir> (default test-results), --out <file>,
 *        --format markdown|terminal (what goes to stdout; defaults to terminal on a TTY).
 * Env: LHCI_SERVER_URL, LHCI_BUILD_TOKEN, LHCI_PROJECT_NAME, PERF_BRANCH, PERF_HASH,
 * PERF_BASE_BRANCH, PERF_RUN_URL — all optional, git fills the gaps locally.
 *
 * The report degrades, it never blocks: a missing server, token, baseline or artifact set ends in
 * an explanatory line and exit 0. Only a programming error (or an unknown mode) exits non-zero.
 */
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { appendFileSync, writeFileSync } from 'fs';
import path from 'path';

// Load .env the same way playwright-base.config does — quiet suppresses the stdout banner.
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

import { fetchBaseline } from '../performance/report/baseline';
import { PerfSample, collectSamples } from '../performance/report/collect';
import { computeDeltas, missingScenarios } from '../performance/report/delta';
import { ReportContext } from '../performance/report/format';
import { measurementId, syntheticUrl } from '../performance/report/identity';
import { LhciClient, LhciProject, compareLink } from '../performance/report/lhciClient';
import { renderReport } from '../performance/report/markdown';
import { augmentLhr } from '../performance/report/syntheticAudits';
import { renderTerminalReport } from '../performance/report/terminal';
import { UploadOutcome, uploadSamples } from '../performance/report/upload';

const MODES = ['ci-pr', 'ci-baseline', 'local'] as const;
type Mode = (typeof MODES)[number];

const FORMATS = ['markdown', 'terminal'] as const;
type Format = (typeof FORMATS)[number];

const DEFAULT_PROJECT_NAME = 'trezor-suite';

const log = (message: string) => {
    // eslint-disable-next-line no-console
    console.log(`[perf-report] ${message}`);
};

const parseArgs = (argv: string[]) => {
    const args: Record<string, string> = {};
    for (let i = 0; i < argv.length; i += 1) {
        const flag = argv[i];
        const value = argv[i + 1];
        if (flag?.startsWith('--') && value !== undefined && !value.startsWith('--')) {
            args[flag.slice(2)] = value;
            i += 1;
        }
    }

    return args;
};

/**
 * Only stdout is affected: the `--out` file and the step summary are consumed by GitHub and stay
 * markdown either way. A developer's shell gets the aligned block, a pipe or a CI log gets the
 * markdown it can paste, and `--format` overrides both directions.
 */
const resolveFormat = (requested: string | undefined): Format => {
    if (requested !== undefined) {
        if (!FORMATS.includes(requested as Format)) {
            throw new Error(`--format must be one of ${FORMATS.join('|')}, got "${requested}"`);
        }

        return requested as Format;
    }

    return process.stdout.isTTY && !process.env.CI ? 'terminal' : 'markdown';
};

const git = (command: string): string | null => {
    try {
        return execSync(`git ${command}`, { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim();
    } catch {
        return null;
    }
};

const resolveGitInfo = (baseBranch: string) => {
    const branch = process.env.PERF_BRANCH || git('rev-parse --abbrev-ref HEAD') || 'unknown';
    const hash = process.env.PERF_HASH || git('rev-parse HEAD') || '0'.repeat(40);

    // On the base branch itself the merge-base is HEAD, and the server would then resolve the
    // build as its own ancestor — the parent commit is LHCI's own convention there. Elsewhere the
    // remote ref comes first: CI checkouts sit on a detached PR head where the local branch name
    // does not exist. Falling back to the hash keeps the upload valid when history is shallow.
    let ancestorHash;
    if (branch === baseBranch) {
        ancestorHash = git('rev-parse HEAD^') ?? hash;
    } else {
        ancestorHash =
            git(`merge-base origin/${baseBranch} HEAD`) ??
            git(`merge-base ${baseBranch} HEAD`) ??
            hash;
    }

    return { branch, hash, ancestorHash };
};

const augmentSamples = (samples: PerfSample[]): PerfSample[] =>
    samples.map(sample =>
        sample.lhr ? { ...sample, lhr: augmentLhr(sample.lhr, sample.perfMetrics) } : sample,
    );

const describeUpload = (outcome: UploadOutcome): string => {
    switch (outcome.status) {
        case 'uploaded':
            return `uploaded ${outcome.runsUploaded} run(s) as build ${outcome.build.id} and sealed it`;
        case 'reused-sealed':
            return `build for this (branch, hash) is already sealed (${outcome.build.id}) — re-run samples not recorded, by design`;
        case 'skipped':
            return `upload skipped: ${outcome.reason}`;
        case 'failed':
            return `upload failed: ${outcome.reason}`;
        // No default: a new outcome must be described deliberately, not mislabeled as a failure.
    }
};

const writeStepSummary = (markdown: string) => {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryPath) {
        return;
    }
    try {
        appendFileSync(summaryPath, `${markdown}\n`);
    } catch (error) {
        log(`step summary could not be written: ${String(error)}`);
    }
};

const connect = async (
    serverUrl: string | undefined,
    buildToken: string | undefined,
): Promise<{ client: LhciClient; project: LhciProject } | null> => {
    if (!serverUrl) {
        log('LHCI_SERVER_URL not set — running without a server.');

        return null;
    }

    const client = new LhciClient(serverUrl, buildToken);
    try {
        const project = await client.findProject(
            process.env.LHCI_PROJECT_NAME || DEFAULT_PROJECT_NAME,
        );
        if (!project) {
            log(`no matching project on ${serverUrl} — running without a server.`);

            return null;
        }

        return { client, project };
    } catch (error) {
        log(`server unreachable (${String(error)}) — running without it.`);

        return null;
    }
};

const main = async () => {
    const args = parseArgs(process.argv.slice(2));
    const mode = args.mode as Mode;
    if (!MODES.includes(mode)) {
        // A wrong mode is CI misconfiguration, not a perf failure — fail loudly.
        throw new Error(`--mode must be one of ${MODES.join('|')}, got "${args.mode}"`);
    }
    const format = resolveFormat(args.format);

    const artifactsDir = args.artifacts ?? 'test-results';
    const { samples: rawSamples, problems } = collectSamples(artifactsDir);
    problems.forEach(problem => log(`note: ${problem}`));

    if (rawSamples.length === 0) {
        // No artifacts means a run without @perf tests (focused PR runs do that on purpose).
        // Writing no report file is load-bearing: the CI job posts nothing and the PR keeps its
        // previous section.
        log(`no perf samples under ${artifactsDir} — nothing measured, no report written.`);

        return;
    }

    const samples = augmentSamples(rawSamples);
    log(
        `${samples.length} sample(s): ${[...new Set(samples.map(sample => measurementId(sample)))].join(', ')}`,
    );

    const baseBranch = process.env.PERF_BASE_BRANCH || 'develop';
    const { branch, hash, ancestorHash } = resolveGitInfo(baseBranch);
    const runUrl = process.env.PERF_RUN_URL || '';
    const notes: string[] = [];

    const connection = await connect(process.env.LHCI_SERVER_URL, process.env.LHCI_BUILD_TOKEN);

    let uploadedBuildId: string | null = null;
    if (connection && mode !== 'local') {
        if (process.env.LHCI_BUILD_TOKEN) {
            const outcome = await uploadSamples({
                ...connection,
                samples,
                branch,
                hash,
                ancestorHash,
                runUrl,
            });
            log(describeUpload(outcome));
            notes.push(describeUpload(outcome));
            if (outcome.status === 'uploaded' || outcome.status === 'reused-sealed') {
                uploadedBuildId = outcome.build.id;
            }
        } else {
            log('LHCI_BUILD_TOKEN not set — upload skipped.');
            notes.push('upload skipped: no build token (fork PR?)');
        }
    }

    if (mode === 'ci-baseline') {
        // The nightly run is the baseline producer; there is no PR to report into, so the step
        // summary carries the outcome and the job is done.
        writeStepSummary(
            [
                `### ⚡ Performance baseline (\`${branch}\` @ \`${hash.slice(0, 7)}\`)`,
                '',
                ...notes.map(note => `- ${note}`),
            ].join('\n'),
        );

        return;
    }

    const baseline = connection ? await fetchBaseline({ ...connection, baseBranch }) : null;
    if (connection && !baseline) {
        notes.push(`no sealed \`${baseBranch}\` baseline on the server yet — absolute values only`);
    }

    const deltas = computeDeltas(samples, baseline);
    const missing = missingScenarios(samples, baseline);

    const firstDelta = deltas[0];
    const compareUrl =
        connection && baseline && uploadedBuildId
            ? compareLink({
                  serverUrl: process.env.LHCI_SERVER_URL ?? '',
                  slug: connection.project.slug,
                  buildId: uploadedBuildId,
                  baseBuildId: baseline.build.id,
                  compareUrl: firstDelta ? syntheticUrl(firstDelta.identity) : undefined,
              })
            : null;

    const context: ReportContext = {
        branch,
        hash,
        baseBranch,
        baseline: baseline ? { hash: baseline.build.hash, runAt: baseline.build.runAt } : null,
        compareUrl,
        runUrl: runUrl || null,
        notes,
    };

    const markdown = renderReport(deltas, missing, context);

    if (args.out) {
        writeFileSync(args.out, markdown);
        log(`report written to ${args.out}`);
    }
    writeStepSummary(markdown);
    if (mode === 'local' || !args.out) {
        const printed =
            format === 'terminal'
                ? renderTerminalReport(deltas, missing, context)
                : `\n${markdown}\n`;
        // eslint-disable-next-line no-console
        console.log(printed);
    }
};

main().catch((error: unknown) => {
    // Everything expected already degraded above; what reaches here is a bug worth a red job.
    console.error('[perf-report] unexpected failure:', error);
    process.exit(1);
});
