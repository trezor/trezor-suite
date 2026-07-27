import chalk from 'chalk';

import type { RequirementResult } from './runRequirements';

export type ReportDeps = {
    readonly console: Pick<Console, 'log'>;
};

export type Report = (results: ReadonlyArray<RequirementResult>) => number;

export type ReportDep = {
    readonly report: Report;
};

type RequirementTiming = {
    readonly requirement: string;
    runCount: number;
    durationMs: number;
};

type TimingRow = {
    readonly requirement: string;
    readonly runCount: string;
    readonly duration: string;
};

const formatDuration = (durationMs: number): string => {
    if (durationMs < 1_000) {
        return `${Math.round(durationMs * 100) / 100} ms`;
    }

    return `${(durationMs / 1_000).toFixed(2)} s`;
};

const reportTimings = (deps: ReportDeps, results: ReadonlyArray<RequirementResult>): void => {
    if (results.length === 0) {
        return;
    }

    const timingsByRequirement = new Map<string, RequirementTiming>();

    for (const result of results) {
        const timing = timingsByRequirement.get(result.requirement);

        if (timing !== undefined) {
            timing.runCount += 1;
            timing.durationMs += result.durationMs;
        } else {
            timingsByRequirement.set(result.requirement, {
                requirement: result.requirement,
                runCount: 1,
                durationMs: result.durationMs,
            });
        }
    }

    const timings = [...timingsByRequirement.values()].sort(
        (a, b) => b.durationMs - a.durationMs || a.requirement.localeCompare(b.requirement),
    );
    const totalDurationMs = timings.reduce((sum, timing) => sum + timing.durationMs, 0);
    const rows: TimingRow[] = timings.map(timing => ({
        requirement: timing.requirement,
        runCount: timing.runCount.toString(),
        duration: formatDuration(timing.durationMs),
    }));
    rows.push({
        requirement: 'Total',
        runCount: results.length.toString(),
        duration: formatDuration(totalDurationMs),
    });

    const requirementWidth = Math.max(
        'Requirement'.length,
        ...rows.map(row => row.requirement.length),
    );
    const runCountWidth = Math.max('Runs'.length, ...rows.map(row => row.runCount.length));
    const durationWidth = Math.max('Duration'.length, ...rows.map(row => row.duration.length));
    const formatRow = ({ requirement, runCount, duration }: TimingRow) =>
        `  ${requirement.padEnd(requirementWidth)} | ${runCount.padStart(runCountWidth)} | ${duration.padStart(durationWidth)}`;

    deps.console.log('Requirement timings:');
    deps.console.log(
        formatRow({ requirement: 'Requirement', runCount: 'Runs', duration: 'Duration' }),
    );
    deps.console.log(
        `  ${'-'.repeat(requirementWidth)}-+-${'-'.repeat(runCountWidth)}-+-${'-'.repeat(durationWidth)}`,
    );

    for (const row of rows) {
        deps.console.log(formatRow(row));
    }

    deps.console.log('');
};

export const createReport =
    (deps: ReportDeps): Report =>
    results => {
        const failed = results.filter(result => result.errors.length > 0);
        const passed = results.filter(result => result.errors.length === 0);

        for (const result of passed) {
            deps.console.log(chalk.green(`  ✓ ${result.requirement} [${result.target}]`));
        }

        for (const result of failed) {
            deps.console.log(chalk.red(`  ✗ ${result.requirement} [${result.target}]`));

            for (const error of result.errors) {
                deps.console.log(chalk.red(`      ${error}`));
            }
        }

        deps.console.log('');
        reportTimings(deps, results);

        if (failed.length > 0) {
            const errorCount = failed.reduce((sum, result) => sum + result.errors.length, 0);
            deps.console.log(
                chalk.red(`${errorCount} error(s) in ${failed.length} requirement(s) failed.`),
            );

            return 1;
        }

        deps.console.log(chalk.green(`All ${passed.length} requirement(s) passed.`));

        return 0;
    };
