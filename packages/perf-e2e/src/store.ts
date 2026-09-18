/**
 * Where a run's numbers go once the run is over, and under which key — shared by every surface we
 * measure: the web and desktop Lighthouse flows and the mobile Detox runs.
 *
 * There is no server. Everything is a plain object in the bucket CI already writes to, and the
 * objects are world-readable, so reading the history back needs no credentials at all.
 *
 * Two layers, deliberately:
 *   - `runs/` holds each measurement's artifact verbatim — a Lighthouse flow result, an LHR, a
 *     native report — kept for local analysis and expired by a lifecycle rule;
 *   - `index/` holds one ~200 B line per measurement, kept forever: this is what a trend reads.
 *
 * What is unified is the envelope: identity, index row, key scheme, baseline document. What stays
 * surface-specific is the artifact itself, which is stored as it was produced and labelled with a
 * `kind` so a reader knows how to render it. Metric keys are namespaced (`lh:`, `rn:`) so nothing
 * can accidentally compare an Android time-to-interactive against a web total blocking time.
 *
 * Everything here is pure: the I/O lives in each surface's publish step.
 */

export const STORE_PREFIX = 'e2e/perf/v1';

/** The public origin the bucket is served on, for links printed next to a report. */
export const STORE_ORIGIN = 'https://dev.suite.sldev.cz';

/**
 * How many index lines one branch file keeps. At a handful of measurements per run this is years of
 * history, and it bounds the read-modify-write the baseline writer performs.
 */
const INDEX_LINE_LIMIT = 20000;

export type PerfSurface = 'web' | 'desktop' | 'android' | 'ios';

/** What the stored artifact is, so a reader knows how to open it. */
export type PerfArtifactKind = 'lhr' | 'flow-result' | 'native-report';

export type PerfArtifact = {
    kind: PerfArtifactKind;
    /** Key segment under the shard, unique within a run: `wallet-discovery`, `report`, … */
    name: string;
    body: string;
};

export type PerfMeasurement = {
    /** Lighthouse flow name on web, screen name on mobile. */
    scenario: string;
    /** Tells two measurements of one scenario in one run apart: a device model, a locale. */
    variant?: string;
    samples: number;
    /** Namespaced keys — `lh:total-blocking-time`, `rn:ttffMs`. Null means not measured. */
    metrics: Record<string, number | null>;
    /** Name of the artifact this was reduced from. Several measurements may share one. */
    artifact?: string;
};

export type PerfRunContext = {
    surface: PerfSurface;
    /** Branch under test — `github.head_ref` on a PR, `github.ref_name` otherwise. */
    branch: string;
    sha: string;
    runId: string;
    runAttempt: string;
    /** The e2e job is sharded; a run holds one set of artifacts per shard. */
    shard: string;
    /** Set on pull requests, which file their index lines per PR instead of per branch. */
    prNumber?: string;
    runUrl?: string;
    generatedAt: string;
    /** Whatever identifies the machine and build the numbers came from. */
    env?: Record<string, string | undefined>;
};

export type PerfRun = {
    context: PerfRunContext;
    artifacts: readonly PerfArtifact[];
    measurements: readonly PerfMeasurement[];
};

export type PerfIndexRow = {
    ts: string;
    surface: PerfSurface;
    branch: string;
    sha: string;
    run: string;
    attempt: string;
    shard: string;
    scenario: string;
    variant?: string;
    samples: number;
    metrics: Record<string, number | null>;
    env?: Record<string, string | undefined>;
    /** Key of the artifact this row was reduced from, relative to the prefix. */
    blob?: { kind: PerfArtifactKind; key: string };
};

export type PerfBaselineDocument = {
    updatedAt: string;
    surface: PerfSurface;
    branch: string;
    sha: string;
    run: string;
    runUrl?: string;
    /** Keyed `scenario` or `scenario [variant]`, holding the same metric map as an index row. */
    measurements: Record<string, Record<string, number | null>>;
};

export type PerfUploadFile = {
    /** Path relative to the bundle root, which is also the key relative to `STORE_PREFIX`. */
    path: string;
    body: string;
};

/**
 * Linear, unlike a `/^-+|-+$/` trim: that one rescans from every position, so a long run of dashes
 * followed by anything else costs quadratic time (CodeQL rates it a ReDoS, and it is right — the
 * value here comes from a branch name, which nothing in this package controls).
 */
const trimDashes = (value: string): string => {
    let start = 0;
    let end = value.length;

    while (start < end && value[start] === '-') {
        start += 1;
    }
    while (end > start && value[end - 1] === '-') {
        end -= 1;
    }

    return value.slice(start, end);
};

/**
 * Branch and scenario names carry slashes and anything else a human types; keys stay flat,
 * printable and stable. Collisions do not matter — sha, run id and shard keep runs distinct.
 */
export const slugify = (value: string): string =>
    trimDashes(value.replace(/[^\w.\-/]+/g, '-').replace(/\//g, '__')).slice(0, 80) || 'unknown';

/** How a measurement is named in the baseline document and in a report. */
export const measurementLabel = ({ scenario, variant }: PerfMeasurement): string =>
    variant ? `${scenario} [${variant}]` : scenario;

export const runPrefix = ({
    surface,
    branch,
    sha,
    runId,
    runAttempt,
    shard,
}: PerfRunContext): string =>
    `runs/${surface}/${slugify(branch)}/${sha}/${runId}-${runAttempt}/shard-${slugify(shard)}`;

export const artifactKey = (context: PerfRunContext, artifactName: string): string =>
    `${runPrefix(context)}/${slugify(artifactName)}.json`;

/**
 * Pull requests write an immutable file per run: many run at once, and nothing may be shared or two
 * runs would race. A branch appends to one rolling file instead, which is safe because the job that
 * writes it is serialized by its own concurrency group.
 */
export const indexKey = (context: PerfRunContext): string =>
    context.prNumber
        ? `index/${context.surface}/pr/${context.prNumber}/${context.runId}-${context.runAttempt}-${slugify(context.shard)}.ndjson`
        : `index/${context.surface}/${slugify(context.branch)}/index.ndjson`;

export const isRollingIndex = (context: PerfRunContext): boolean => !context.prNumber;

export const baselineKey = (surface: PerfSurface, branch: string): string =>
    `baseline/${surface}/${slugify(branch)}/latest.json`;

export const publicUrl = (key: string): string => `${STORE_ORIGIN}/${STORE_PREFIX}/${key}`;

export const toIndexRows = ({ context, artifacts, measurements }: PerfRun): PerfIndexRow[] => {
    const kindByName = new Map(artifacts.map(artifact => [artifact.name, artifact.kind]));

    return measurements.map(measurement => {
        // A measurement naming an artifact the run did not produce gets no blob rather than a
        // dangling key: the row still carries the numbers, it just has nothing to drill into.
        const kind = measurement.artifact ? kindByName.get(measurement.artifact) : undefined;

        return {
            ts: context.generatedAt,
            surface: context.surface,
            branch: context.branch,
            sha: context.sha,
            run: context.runId,
            attempt: context.runAttempt,
            shard: context.shard,
            scenario: measurement.scenario,
            ...(measurement.variant ? { variant: measurement.variant } : {}),
            samples: measurement.samples,
            metrics: measurement.metrics,
            ...(context.env ? { env: context.env } : {}),
            ...(measurement.artifact && kind
                ? { blob: { kind, key: artifactKey(context, measurement.artifact) } }
                : {}),
        };
    });
};

export const renderNdjson = (rows: readonly PerfIndexRow[]): string =>
    rows.map(row => JSON.stringify(row)).join('\n') + (rows.length > 0 ? '\n' : '');

/** A line the file already holds that cannot be parsed is dropped, never allowed to fail a run. */
export const parseNdjson = (text: string): PerfIndexRow[] =>
    text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .flatMap(line => {
            try {
                return [JSON.parse(line) as PerfIndexRow];
            } catch {
                return [];
            }
        });

const rowIdentity = (row: PerfIndexRow) =>
    `${row.surface}/${row.run}/${row.attempt}/${row.shard}/${row.scenario}/${row.variant ?? ''}`;

/**
 * Re-running a workflow re-measures the same identity: the new numbers replace the old line rather
 * than adding a second one, so a re-run corrects a point on the trend instead of doubling it.
 */
export const appendIndexRows = (existing: string, rows: readonly PerfIndexRow[]): string => {
    const incoming = new Set(rows.map(rowIdentity));
    const kept = parseNdjson(existing).filter(row => !incoming.has(rowIdentity(row)));

    return renderNdjson([...kept, ...rows].slice(-INDEX_LINE_LIMIT));
};

export const toBaselineDocument = (runs: readonly PerfRun[]): PerfBaselineDocument => {
    // Every shard of one run contributes its measurements; a scenario measured by two shards keeps
    // the last one written, because they measured the same thing, not two different things.
    const [first] = runs;

    if (!first) {
        throw new Error('a baseline needs at least one run');
    }

    return {
        updatedAt: first.context.generatedAt,
        surface: first.context.surface,
        branch: first.context.branch,
        sha: first.context.sha,
        run: first.context.runId,
        ...(first.context.runUrl ? { runUrl: first.context.runUrl } : {}),
        measurements: Object.fromEntries(
            runs.flatMap(({ measurements }) =>
                measurements.map(measurement => [
                    measurementLabel(measurement),
                    measurement.metrics,
                ]),
            ),
        ),
    };
};

/**
 * Everything a publish contributes, as files: every shard's artifacts, one index file per index key
 * the shards fall under, and the baseline when this publish seals one. The caller writes them under
 * a bundle root and lets `aws s3 cp --recursive` put the tree at `STORE_PREFIX`, so the layout on
 * disk is the layout in the bucket.
 *
 * Artifacts come first on purpose: uploaded in this order, an index line never points at an object
 * that is not there yet — the guarantee a server gives by sealing a build.
 *
 * One publish writes a whole run, every shard of it, so nothing here races with a sibling job.
 */
export const buildUploadBundle = (
    runs: readonly PerfRun[],
    options: { existingIndex?: string; sealBaseline?: boolean } = {},
): PerfUploadFile[] => {
    const files: PerfUploadFile[] = runs.flatMap(run =>
        run.artifacts.map(artifact => ({
            path: artifactKey(run.context, artifact.name),
            body: artifact.body,
        })),
    );

    // Shards of one branch run share a rolling index file; on a pull request each shard has its own.
    const rowsByIndex = new Map<string, { context: PerfRunContext; rows: PerfIndexRow[] }>();

    for (const run of runs) {
        const key = indexKey(run.context);
        const entry = rowsByIndex.get(key) ?? { context: run.context, rows: [] };

        entry.rows.push(...toIndexRows(run));
        rowsByIndex.set(key, entry);
    }

    for (const [key, { context, rows }] of rowsByIndex) {
        files.push({
            path: key,
            body: isRollingIndex(context)
                ? appendIndexRows(options.existingIndex ?? '', rows)
                : renderNdjson(rows),
        });
    }

    if (options.sealBaseline && runs.length > 0) {
        const document = toBaselineDocument(runs);

        files.push({
            path: baselineKey(document.surface, document.branch),
            body: `${JSON.stringify(document, null, 2)}\n`,
        });
    }

    return files;
};
