import { ScenarioDelta } from './delta';
import { MetricUnit } from './identity';

/**
 * What both renderers say the same way: the numbers, the ages, the verdict tally. Markdown and
 * terminal differ in layout only, so anything a reader would expect to read identically in a PR and
 * in a shell lives here.
 */

export type ReportContext = {
    branch: string;
    hash: string;
    baseBranch: string;
    baseline: { hash: string; runAt: string } | null;
    /** Deep link into the server's compare view; null when nothing was uploaded. */
    compareUrl: string | null;
    runUrl: string | null;
    /** Extra status lines (upload outcome, degradations) printed under the header. */
    notes: string[];
};

export const short = (hash: string) => hash.slice(0, 7);

export const formatAge = (runAt: string): string => {
    const hours = Math.max(0, Math.round((Date.now() - new Date(runAt).getTime()) / 3_600_000));
    if (hours < 48) {
        return `${hours} h old`;
    }

    return `${Math.round(hours / 24)} d old`;
};

/** `12 345` — the report is read by humans, not parsed. */
const group = (value: number) =>
    Math.round(value)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const formatValue = (value: number, unit: MetricUnit): string => {
    switch (unit) {
        case 'ms':
            return `${group(value)} ms`;
        case 'bytes':
            return value >= 1024 * 1024
                ? `${(value / (1024 * 1024)).toFixed(1)} MB`
                : `${group(value / 1024)} KB`;
        case 'unitless':
            return value.toFixed(3);
        case 'count':
            return group(value);
        // No default: a new unit must be formatted deliberately, not fall through as a count.
    }
};

/** `+25%`, `−15%` — a zero baseline has no meaningful percentage, so it gets none. */
export const formatPercent = (baseline: number, current: number): string => {
    const diff = current - baseline;
    if (baseline <= 0) {
        return '';
    }

    return `${diff >= 0 ? '+' : '−'}${Math.round((Math.abs(diff) / baseline) * 100)}%`;
};

export type VerdictCounts = { regressions: number; improvements: number; noise: number };

export const countVerdicts = (deltas: ScenarioDelta[]): VerdictCounts => {
    const cells = deltas.flatMap(delta => delta.metrics);

    return {
        regressions: cells.filter(cell => cell.verdict === 'regression').length,
        improvements: cells.filter(cell => cell.verdict === 'improvement').length,
        noise: cells.filter(
            cell => !cell.verdict && cell.baseline !== null && cell.current !== null,
        ).length,
    };
};

export const verdictSentence = ({ regressions, improvements, noise }: VerdictCounts): string =>
    `${regressions} regression${regressions === 1 ? '' : 's'}, ${improvements} improvement${improvements === 1 ? '' : 's'}, ${noise} within noise.`;

const TARGET_HEADINGS: Record<string, string> = { desktop: 'Desktop', web: 'Web' };

export const targetHeading = (target: string) => TARGET_HEADINGS[target] ?? target;
