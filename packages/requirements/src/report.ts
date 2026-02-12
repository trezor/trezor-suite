import chalk from 'chalk';

import type { RequirementResult } from './runRequirements';

export type ReportDeps = {
    readonly console: Pick<Console, 'log'>;
};

export type Report = (results: ReadonlyArray<RequirementResult>) => number;

export type ReportDep = {
    readonly report: Report;
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
