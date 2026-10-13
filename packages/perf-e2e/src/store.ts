/**
 * Key scheme and object shapes of the e2e performance store, shared by every surface. Pure: each
 * surface's publish step does the I/O. Layout and rationale: docs/tests/perf-history.md.
 */

export const STORE_PREFIX = 'e2e/perf/v1';

/** The public origin the bucket is served on, for links printed next to a report. */
export const STORE_ORIGIN = 'https://dev.suite.sldev.cz';

/** Years of history at a handful of measurements per run; bounds the read-modify-write. */
const INDEX_LINE_LIMIT = 20000;

export type PerfSurface = 'web' | 'desktop' | 'android' | 'ios';

/**
 * What the stored artifact is, so a reader knows how to open it: `lhr` and `flow-result` render as
 * Lighthouse HTML, the two `*-report` kinds are our own comparison documents.
 */
export type PerfArtifactKind = 'lhr' | 'flow-result' | 'native-report' | 'browser-report';

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
    /** Recorded under Lighthouse tracing, which inflates in-page numbers; never mix with bare runs. */
    profiled?: boolean;
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
    /** See `PerfRunContext.profiled`. */
    profiled?: boolean;
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

/** Not `/^-+|-+$/`: that is quadratic on long dash runs, and the input is a branch name (ReDoS). */
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
 * Pull requests run concurrently, so each run gets its own immutable file. A branch appends to one
 * rolling file; its publish job is serialized by a concurrency group.
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
        // No blob rather than a dangling key when the run did not produce the named artifact.
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
            ...(context.profiled ? { profiled: true } : {}),
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

/** A re-run replaces its own lines, so it corrects a point on the trend instead of doubling it. */
export const appendIndexRows = (existing: string, rows: readonly PerfIndexRow[]): string => {
    const incoming = new Set(rows.map(rowIdentity));
    const kept = parseNdjson(existing).filter(row => !incoming.has(rowIdentity(row)));

    return renderNdjson([...kept, ...rows].slice(-INDEX_LINE_LIMIT));
};

export const toBaselineDocument = (runs: readonly PerfRun[]): PerfBaselineDocument => {
    // A scenario measured by two shards keeps the last one: both measured the same thing.
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
 * Every object one run publishes, laid out as in the bucket under `STORE_PREFIX`. Artifacts come
 * first so that, uploaded in order, an index line never points at a missing object.
 */
export const buildUploadBundle = (
    runs: readonly PerfRun[],
    options: {
        /** Current contents of each rolling index, per key: every surface has its own index. */
        existingIndex?: Readonly<Record<string, string>>;
        sealBaseline?: boolean;
    } = {},
): PerfUploadFile[] => {
    const files: PerfUploadFile[] = runs.flatMap(run =>
        run.artifacts.map(artifact => ({
            path: artifactKey(run.context, artifact.name),
            body: artifact.body,
        })),
    );

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
                ? appendIndexRows(options.existingIndex?.[key] ?? '', rows)
                : renderNdjson(rows),
        });
    }

    if (options.sealBaseline) {
        // One baseline per surface: labels like `wallet-discovery [T3W1]` exist on web and desktop.
        const bySurface = new Map<PerfSurface, PerfRun[]>();

        for (const run of runs) {
            bySurface.set(run.context.surface, [
                ...(bySurface.get(run.context.surface) ?? []),
                run,
            ]);
        }

        for (const surfaceRuns of bySurface.values()) {
            const document = toBaselineDocument(surfaceRuns);

            files.push({
                path: baselineKey(document.surface, document.branch),
                body: `${JSON.stringify(document, null, 2)}\n`,
            });
        }
    }

    return files;
};
