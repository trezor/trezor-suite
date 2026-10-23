#!/usr/bin/env node
import { ESLint } from 'eslint';
import { parseArgs } from 'node:util';

// The config package reads this at import time, so it is set before anything imports it.
process.env.ESLINT_RULE_FILTER_ACTIVE = 'true';

const { parseRuleSet } = await import('../src/ruleSets.mjs');
const { createRunnerOptionsModuleURL } = await import('../src/runnerOptions.mjs');

const { values, positionals } = parseArgs({
    allowPositionals: true,
    allowNegative: true,
    options: {
        fix: { type: 'boolean', default: false },
        'warn-ignored': { type: 'boolean', default: true },
        'max-warnings': { type: 'string', default: '0' },
    },
});
const maxWarnings = Number(values['max-warnings']);

const lint = async () => {
    const eslint = await ESLint.fromOptionsModule(
        createRunnerOptionsModuleURL({
            ruleSet: parseRuleSet(process.env.ESLINT_RULE_SET),
            patterns: positionals,
            fix: values.fix,
            warnIgnored: values['warn-ignored'],
            cwd: process.cwd(),
        }),
    );
    const results = await eslint.lintFiles(positionals);

    if (values.fix) {
        await ESLint.outputFixes(results);
    }

    const errorCount = results.reduce((count, result) => count + result.errorCount, 0);
    const warningCount = results.reduce((count, result) => count + result.warningCount, 0);
    const hasTooManyWarnings = warningCount > maxWarnings;

    const formatter = await eslint.loadFormatter('stylish');
    const output = await formatter.format(
        results,
        hasTooManyWarnings
            ? { maxWarningsExceeded: { maxWarnings, foundWarnings: warningCount } }
            : {},
    );

    if (output) {
        process.stdout.write(`${output}\n`);
    }

    if (errorCount === 0 && hasTooManyWarnings) {
        console.error(`ESLint found too many warnings (maximum: ${maxWarnings}).`);
    }

    return errorCount > 0 || hasTooManyWarnings ? 1 : 0;
};

try {
    process.exitCode = await lint();
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
}
