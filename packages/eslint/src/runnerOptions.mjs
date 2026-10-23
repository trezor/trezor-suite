import { globSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { basename } from 'node:path';

/**
 * @typedef {import('./ruleSets.mjs').RuleSet} RuleSet
 */

/**
 * A separate cache per rule set: ESLint keys cached results on one config hash per file, so two
 * rule sets sharing a file would keep invalidating each other.
 * @type {Record<RuleSet, string>}
 */
const cacheLocations = {
    basic: '.eslintcache',
    'type-aware': '.eslintcache-type-aware',
    all: '.eslintcache-all',
};

/**
 * Files a worker thread must lint before it pays for itself. Every worker loads the whole config
 * and, for the type-aware set, builds its own TypeScript program, and Nx already runs three tasks
 * at once on a four-core CI runner, so extra threads only pay off on the few largest workspaces.
 * Measured on `packages/suite`: basic 41 s single-threaded against 18 s with five workers;
 * type-aware 59 s against 36 s with three, while ESLint's `auto` was slower than one thread. On
 * workspaces of a few hundred files the threads were neutral in isolation and twice as slow under
 * Nx's parallelism, and ESLint's own sizing of one worker per 50 files is what made the first
 * CI run of the split lint 362 workspaces with threads.
 * @type {Record<RuleSet, number>}
 */
const filesPerWorker = {
    basic: 1000,
    'type-aware': 2000,
    all: 2000,
};

const MAX_WORKERS = 5;

// The directories the shared config ignores; enough to keep the estimate from counting
// build output and dependencies.
const ignoredDirectoryNames = new Set([
    'node_modules',
    'lib',
    'libDev',
    'dist',
    'build',
    'build-electron',
    'build-webextension',
    'coverage',
    '.nx',
    '.expo',
    '.cache',
]);

/**
 * @typedef {Object} GetWorkerCountParams
 * @property {RuleSet} ruleSet
 * @property {number} fileCount
 * @property {number} cpuCount
 */

/**
 * The worker count ESLint's `concurrency` option takes: like ESLint's `auto`, at most half the
 * cores, but with the per-set file threshold above. ESLint treats a count below two as
 * single-threaded.
 * @param {GetWorkerCountParams} params
 */
export const getWorkerCount = ({ ruleSet, fileCount, cpuCount }) =>
    Math.max(
        1,
        Math.min(MAX_WORKERS, cpuCount >> 1, Math.ceil(fileCount / filesPerWorker[ruleSet])),
    );

/**
 * @typedef {Object} GetConcurrencyParams
 * @property {RuleSet} ruleSet
 * @property {string[]} patterns
 * @property {string} cwd
 */

/** @param {GetConcurrencyParams} params */
const getConcurrency = ({ ruleSet, patterns, cwd }) => {
    const fileCount = globSync(patterns, {
        cwd,
        exclude: path => ignoredDirectoryNames.has(basename(path)),
    }).length;

    return getWorkerCount({ ruleSet, fileCount, cpuCount: availableParallelism() });
};

/**
 * @typedef {Object} CreateRunnerOptionsModuleURLParams
 * @property {RuleSet} ruleSet
 * @property {string[]} patterns The files to lint, as passed to `lintFiles`.
 * @property {boolean} fix
 * @property {boolean} warnIgnored
 * @property {string} cwd
 */

/**
 * ESLint's multithreaded mode re-imports its options in every worker, so a `ruleFilter` function
 * can only be passed through an options module. Like ESLint's own CLI, the module is an inline
 * `data:` URL that embeds the serializable options and derives the filter from the shared rule set.
 * @param {CreateRunnerOptionsModuleURLParams} params
 */
export const createRunnerOptionsModuleURL = ({ ruleSet, patterns, fix, warnIgnored, cwd }) => {
    const options = {
        cwd,
        cache: true,
        cacheStrategy: 'content',
        cacheLocation: cacheLocations[ruleSet],
        concurrency: getConcurrency({ ruleSet, patterns, cwd }),
        fix,
        warnIgnored,
    };
    const ruleSetsURL = new URL('./ruleSets.mjs', import.meta.url).href;
    const source =
        `import { createRuleFilter } from ${JSON.stringify(ruleSetsURL)};\n` +
        `export default { ...${JSON.stringify(options)}, ruleFilter: createRuleFilter(${JSON.stringify(ruleSet)}) };\n`;

    return new URL(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
};
