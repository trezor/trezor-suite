import { readFileSync, readdirSync } from 'fs';
import { type FlowResult } from 'lighthouse';
import { join } from 'path';

import { PerfJsonReport, PerfMetricKey, PerfMetrics } from '@trezor/perf-e2e';

/** One timespan step's Lighthouse result — the unit the LHCI server stores and compares. */
export type Lhr = FlowResult['steps'][number]['lhr'];

export type PerfSample = {
    target: string;
    model: string;
    scenario: string;
    retry: number;
    /** null when the timespan failed but `perf.measure` still delivered its in-page numbers. */
    lhr: Lhr | null;
    /** null when the scenario was profiled without in-page instrumentation. */
    perfMetrics: PerfMetrics | null;
};

export type Collection = {
    samples: PerfSample[];
    /** What was skipped and why — reported, never thrown: a broken shard costs its files, not the report. */
    problems: string[];
};

// Written by lighthouseTimespan.ts / perfMeasure.ts next to each test's artifacts.
const FLOW_RESULT_FILE = 'lighthouse-flow-result.json';
const FLOW_META_FILE = 'lighthouse-flow-meta.json';
const PERF_REPORT_PREFIX = 'perf-report-';

type FlowMeta = { model: string; target: string; retry: number; title: string };

type PerfReportFile = {
    meta: { scenario: string; model: string; target: string; retry: number };
    report: PerfJsonReport;
};

const readJson = <T>(path: string): T | null => {
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as T;
    } catch {
        return null;
    }
};

/** The in-page metrics as measured, reassembled from the report rows that carried them. */
const toPerfMetrics = (report: PerfJsonReport): PerfMetrics =>
    Object.fromEntries(report.metrics.map(metric => [metric.key, metric.current])) as Record<
        PerfMetricKey,
        number | null
    >;

const collectDir = (dir: string, files: string[], collection: Collection) => {
    const flowMeta = files.includes(FLOW_META_FILE)
        ? readJson<FlowMeta>(join(dir, FLOW_META_FILE))
        : null;
    const flowResultPresent = files.includes(FLOW_RESULT_FILE);
    const flowResult = flowResultPresent ? readJson<FlowResult>(join(dir, FLOW_RESULT_FILE)) : null;

    const samples: PerfSample[] = [];

    if (flowResult && flowMeta) {
        for (const step of flowResult.steps ?? []) {
            samples.push({
                target: flowMeta.target,
                model: flowMeta.model,
                scenario: step.name,
                retry: flowMeta.retry ?? 0,
                lhr: step.lhr,
                perfMetrics: null,
            });
        }
    } else if (flowResultPresent) {
        // Unreadable, or without the sidecar there is no telling which measurement it samples.
        collection.problems.push(
            `${dir}: flow result unreadable or missing its ${FLOW_META_FILE} — skipped`,
        );
    }

    for (const file of files) {
        if (!file.startsWith(PERF_REPORT_PREFIX) || !file.endsWith('.json')) {
            continue;
        }

        const perfReport = readJson<PerfReportFile>(join(dir, file));
        if (!perfReport?.meta?.scenario || !perfReport.report) {
            collection.problems.push(`${dir}/${file}: not a perf report — skipped`);
            continue;
        }

        const { meta } = perfReport;
        const perfMetrics = toPerfMetrics(perfReport.report);
        // The timespan around the same interaction lives in the same directory, so pairing by
        // scenario within the directory is exact — retries land in directories of their own.
        const lhrSample = samples.find(sample => sample.scenario === meta.scenario);

        if (lhrSample) {
            lhrSample.perfMetrics = perfMetrics;
        } else {
            samples.push({
                target: meta.target,
                model: meta.model,
                scenario: meta.scenario,
                retry: meta.retry ?? 0,
                lhr: null,
                perfMetrics,
            });
        }
    }

    collection.samples.push(...samples);
};

const walk = (dir: string, collection: Collection) => {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        collection.problems.push(`${dir}: unreadable — skipped`);

        return;
    }

    const files = entries.filter(entry => entry.isFile()).map(entry => entry.name);
    collectDir(dir, files, collection);

    for (const entry of entries) {
        if (entry.isDirectory()) {
            walk(join(dir, entry.name), collection);
        }
    }
};

/**
 * Walks an artifacts directory — either downloaded CI artifacts (one subdirectory per shard) or a
 * local `test-results/` — and pairs each test directory's flow result, its meta sidecar and its
 * perf reports into samples. Partial directories degrade to partial samples, never to a failure.
 */
export const collectSamples = (artifactsDir: string): Collection => {
    const collection: Collection = { samples: [], problems: [] };
    walk(artifactsDir, collection);

    return collection;
};
