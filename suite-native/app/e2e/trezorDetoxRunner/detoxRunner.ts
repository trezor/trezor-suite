/* eslint-disable no-console */
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import minimist from 'minimist';
import * as path from 'path';
import xml2js from 'xml2js';

import { getAllQuarantineActions } from '@trezor/e2e-utils';
import type { Action, RuleMatcherCondition } from '@trezor/e2e-utils';

import { ProjectConfig, RunnerConfig } from './types';

const getProjectsFromCmdlineArgs = (
    projectArg: string | string[] | undefined,
): string[] | undefined => {
    if (!projectArg) {
        return undefined;
    }

    if (Array.isArray(projectArg)) {
        return projectArg;
    }

    return [projectArg];
};

const parseArgs = () => {
    const argv = minimist(process.argv.slice(2), { boolean: ['headless', 'quarantine', 'help'] });

    if (argv.help) {
        console.log(`
Usage: tsx e2e/trezorDetoxRunner/detoxRunner.ts --config <path> [options] [testFiles]

Options:
  --config <path>       Path to the runner config file (required)
  --project <name>      Project name to run (can be specified multiple times)
  --shard <n>           Current shard index (0-based)
  --totalShards <n>     Total number of shards
  --headless            Run tests in headless mode
  --quarantine          Enable quarantine processing via Currents actions (requires CURRENTS_PROJECT_ID and CURRENTS_API_KEY env vars)
  --help                Show this help message

Arguments:
  testFiles             Space-separated list of test files to run. If provided, only these files will be executed.
`);
        process.exit(0);
    }

    if (!argv.config) {
        console.error('Error: --config argument is required');
        process.exit(1);
    }

    const configPath = path.resolve(process.cwd(), argv.config);

    if (!fs.existsSync(configPath)) {
        console.error(`Error: Config file not found at ${configPath}`);
        process.exit(1);
    }

    const { shard } = argv;
    const { totalShards } = argv;
    const { headless } = argv;
    const quarantine = !!argv.quarantine;
    const projects = getProjectsFromCmdlineArgs(argv.project);
    const testFiles = argv._;

    const shardingEnabled = shard !== undefined && totalShards !== undefined;

    if (
        (shard !== undefined && totalShards === undefined) ||
        (totalShards !== undefined && shard === undefined)
    ) {
        console.error('Error: Both --shard and --totalShards must be provided together');
        process.exit(1);
    }

    if (shardingEnabled && testFiles.length > 0) {
        console.error('Error: Sharding arguments cannot be used with specific test files');
        process.exit(1);
    }

    if (
        shardingEnabled &&
        (isNaN(shard) || isNaN(totalShards) || shard < 0 || shard >= totalShards)
    ) {
        console.error(
            `Error: Invalid shard configuration. Shard must be between 0 and ${totalShards - 1}`,
        );
        process.exit(1);
    }

    return {
        configPath,
        shard,
        totalShards,
        headless: !!headless,
        quarantine,
        projects,
        testFiles,
    };
};

/**
 * Fetch quarantined actions from Currents for the configured project.
 * Returns an empty array and logs a warning if the required env vars are missing.
 */
const fetchQuarantinedActions = async (): Promise<Action[]> => {
    const projectId = process.env.CURRENTS_PROJECT_ID;
    const apiKey = process.env.CURRENTS_API_KEY;

    if (!projectId || !apiKey) {
        console.warn(
            '[quarantine] Missing CURRENTS_PROJECT_ID or CURRENTS_API_KEY env vars — skipping quarantine processing.',
        );

        return [];
    }

    try {
        const quarantined = await getAllQuarantineActions(projectId);
        console.log(
            `[quarantine] Loaded ${quarantined.length} quarantine action(s) from Currents.`,
        );

        return quarantined;
    } catch (err) {
        console.warn('[quarantine] Failed to fetch actions from Currents:', err);

        return [];
    }
};

/**
 * Build the titlePath array for a testcase, mirroring the format that the Currents Test Explorer
 * returns for JUnit-uploaded tests and that the quarantine bot stores in action conditions.
 *
 * When tests are uploaded to Currents via `currents convert --input-format=junit`, Currents
 * constructs the title as "<testsuite name> > <testcase name>".  The quarantine bot then splits
 * that on " > " (via normalizeTitlePath) to produce a two-element array that it stores as the
 * `titlePath` condition value.  We need to reproduce that same two-element array here so that
 * `incAll` / `eq` conditions created by the bot actually match.
 */
const getTitlePath = (suiteName: string, tc: any): string[] => {
    const testName: string = tc.$?.name ?? '';

    return [suiteName, testName].filter(Boolean);
};

interface TestIdentity {
    testTitle: string;
    titlePath: string[];
}

/**
 * Evaluate a single condition against the test identity.
 * Supports:
 *   - type "title"     — matches against the flat JUnit `name` string
 *   - type "titlePath" — matches against the reconstructed path array (joined with " > " for string ops)
 * Supported ops: "eq", "contains", "startsWith", "endsWith", "incAll" (titlePath only).
 *
 * Note: "incAll" is the op produced by the auto-quarantine bot and checks that every
 * element of the condition value array is present somewhere in the titlePath array.
 */
const evaluateCondition = (cond: RuleMatcherCondition, identity: TestIdentity): boolean => {
    if (cond.type === 'title') {
        const values = Array.isArray(cond.value) ? cond.value : [cond.value];
        const { testTitle } = identity;

        let result: boolean;
        switch (cond.op) {
            case 'eq':
                result = values.some(v => v === testTitle);
                break;
            case 'contains':
                result = values.some(v => testTitle.includes(v));
                break;
            case 'startsWith':
                result = values.some(v => testTitle.startsWith(v));
                break;
            case 'endsWith':
                result = values.some(v => testTitle.endsWith(v));
                break;
            default:
                result = false;
        }

        return result;
    }

    if (cond.type === 'titlePath') {
        const { titlePath } = identity;
        const titlePathStr = titlePath.join(' > ');

        // value may be a string[] (array equality/inclusion) or a string
        let result: boolean;
        const values = Array.isArray(cond.value) ? cond.value : [cond.value];
        switch (cond.op) {
            // incAll: every element in the condition value must be present in titlePath
            // This is the op created by the auto-quarantine bot.
            case 'incAll':
                result = values.every(v => titlePath.includes(v));
                break;
            case 'eq':
                if (Array.isArray(cond.value)) {
                    result =
                        cond.value.length === titlePath.length &&
                        cond.value.every((v, i) => v === titlePath[i]);
                } else {
                    result = values.some(v => v === titlePathStr);
                }
                break;
            case 'contains':
                result = values.some(v => titlePathStr.includes(v));
                break;
            case 'startsWith':
                result = values.some(v => titlePathStr.startsWith(v));
                break;
            case 'endsWith':
                result = values.some(v => titlePathStr.endsWith(v));
                break;
            default:
                result = false;
        }

        return result;
    }

    return false;
};

/**
 * Check whether a test (identified by title and titlePath) matches the given action's matcher.
 */
const matchesAction = (identity: TestIdentity, action: Action): boolean => {
    const { matcher } = action;
    const conds = matcher.cond;

    const result =
        matcher.op === 'AND'
            ? conds.every(c => evaluateCondition(c, identity))
            : conds.some(c => evaluateCondition(c, identity));

    return result;
};

/**
 * Determine if a test is covered by any quarantined action.
 */
const isQuarantined = (identity: TestIdentity, quarantinedActions: Action[]): boolean =>
    quarantinedActions.some(a => matchesAction(identity, a));

const getJestTestFiles = (): string[] => {
    try {
        const output = execSync('npx jest --listTests --config ./e2e/jest.config.js', {
            cwd: process.cwd(),
            encoding: 'utf8',
            env: { ...process.env, CI: 'true', TDR_PROJECT_NAME: 'detox' },
        });

        return output
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && path.isAbsolute(line))
            .sort();
    } catch (e) {
        console.error('Failed to list test files via Jest:', e);
        process.exit(1);
    }
};

/**
 * Process the JUnit XML report for a project.
 * - Filters out skipped tests that don't match grep (existing behaviour).
 * - When quarantinedActions are provided, converts failing testcases that are
 *   quarantined into skipped ones and adjusts suite-level counters.
 *
 * Returns true when there are still genuine (non-quarantined) failures remaining,
 * false when every failure was quarantined (or there were no failures).
 */
const processJUnitReport = async (
    projectName: string,
    detoxFailed: boolean,
    grep?: string,
    quarantinedActions: Action[] = [],
): Promise<boolean> => {
    const reportPath = path.resolve(process.cwd(), 'reports', `${projectName}-junit-report.xml`);
    const reportExists = fs.existsSync(reportPath);

    // Detox crashed without producing a report — treat as genuine failure regardless of other options.
    if (detoxFailed && !reportExists) {
        console.warn(
            `Report not found at ${reportPath} and Detox already failed — treating as failure.`,
        );

        return true;
    }

    // Nothing to process — report either passed cleanly or doesn't exist for a benign reason.
    if (!grep && quarantinedActions.length === 0) return false;

    if (!reportExists) {
        console.warn(`Report not found at ${reportPath}`);

        return false;
    }

    try {
        const xml = fs.readFileSync(reportPath, 'utf8');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xml);

        if (!result.testsuites || !result.testsuites.testsuite) {
            console.log(`No test suites found in report for ${projectName}.`);

            return false;
        }

        const regex = grep ? new RegExp(grep) : null;

        result.testsuites.testsuite.forEach((suite: any) => {
            if (!suite.testcase) return;

            // Step 1: grep-filter (existing behaviour — remove non-matching skipped tests)
            if (regex) {
                suite.testcase = suite.testcase.filter((tc: any) => {
                    const isSkipped = tc.skipped !== undefined;
                    if (!isSkipped) return true;

                    return regex.test(tc.$.name);
                });
            }

            // Step 2: quarantine processing — convert quarantined failures to skipped
            if (quarantinedActions.length > 0) {
                let quarantinedFailures = 0;
                let quarantinedErrors = 0;

                suite.testcase.forEach((tc: any) => {
                    const hasFailure = tc.failure !== undefined;
                    const hasError = tc.error !== undefined;
                    if (!hasFailure && !hasError) return;

                    const identity: TestIdentity = {
                        testTitle: tc.$?.name ?? '',
                        titlePath: getTitlePath(suite.$?.name ?? '', tc),
                    };
                    if (isQuarantined(identity, quarantinedActions)) {
                        console.log(`[quarantine] Marking as skipped: ${identity.testTitle}`);
                        if (hasFailure) {
                            delete tc.failure;
                            quarantinedFailures++;
                        }
                        if (hasError) {
                            delete tc.error;
                            quarantinedErrors++;
                        }
                        tc.skipped = [{}];
                    }
                });

                // Update suite-level counters to reflect quarantined tests
                const quarantinedCount = quarantinedFailures + quarantinedErrors;
                if (quarantinedCount > 0 && suite.$) {
                    if (quarantinedFailures > 0) {
                        suite.$.failures = String(
                            Math.max(
                                0,
                                parseInt(suite.$.failures ?? '0', 10) - quarantinedFailures,
                            ),
                        );
                    }
                    if (quarantinedErrors > 0) {
                        suite.$.errors = String(
                            Math.max(0, parseInt(suite.$.errors ?? '0', 10) - quarantinedErrors),
                        );
                    }
                    suite.$.skipped = String(
                        parseInt(suite.$.skipped ?? '0', 10) + quarantinedCount,
                    );
                    console.log(
                        `[quarantine] ${projectName}/${suite.$.name ?? 'suite'}: ${quarantinedCount} test(s) quarantined (${quarantinedFailures} failure(s), ${quarantinedErrors} error(s)).`,
                    );
                }
            }
        });

        // Recompute root <testsuites> aggregate counters from the (now-updated) <testsuite> children
        if (result.testsuites.$) {
            const totals = result.testsuites.testsuite.reduce(
                (acc: { failures: number; errors: number; skipped: number }, suite: any) => ({
                    failures: acc.failures + parseInt(suite.$?.failures ?? '0', 10),
                    errors: acc.errors + parseInt(suite.$?.errors ?? '0', 10),
                    skipped: acc.skipped + parseInt(suite.$?.skipped ?? '0', 10),
                }),
                { failures: 0, errors: 0, skipped: 0 },
            );
            result.testsuites.$.failures = String(totals.failures);
            result.testsuites.$.errors = String(totals.errors);
            result.testsuites.$.skipped = String(totals.skipped);
        }

        const builder = new xml2js.Builder();
        const newXml = builder.buildObject(result);
        fs.writeFileSync(reportPath, newXml);
        console.log(`Processed and updated JUnit report for ${projectName}`);

        const hasRemainingFailures = result.testsuites.testsuite.some(
            (suite: any) =>
                parseInt(suite.$?.failures ?? '0', 10) > 0 ||
                parseInt(suite.$?.errors ?? '0', 10) > 0,
        );

        return hasRemainingFailures;
    } catch (error) {
        console.error(`Failed to process JUnit report for ${projectName}:`, error);

        return true; // Treat parse errors as failures to be safe
    }
};

const uploadToCurrents = (projectName: string) => {
    const reportPath = path.resolve(process.cwd(), 'reports', `${projectName}-junit-report.xml`);
    const currentsDir = path.resolve(process.cwd(), 'currents', projectName);

    if (!fs.existsSync(reportPath)) {
        console.warn(`Report not found at ${reportPath}, skipping Currents upload.`);

        return;
    }

    if (
        !process.env.CURRENTS_PROJECT_ID ||
        !process.env.CURRENTS_RECORD_KEY ||
        !process.env.CURRENTS_CI_BUILD_ID
    ) {
        console.warn(
            'Missing Currents environment variables (CURRENTS_PROJECT_ID, CURRENTS_RECORD_KEY, CURRENTS_CI_BUILD_ID), skipping upload.',
        );

        return;
    }

    try {
        console.log(`Converting JUnit report for ${projectName} to Currents format...`);
        execSync(
            `npx currents convert --input-format=junit --input-file="${reportPath}" --output-dir="${currentsDir}" --framework=postman --framework-version=v11.2.0`,
            {
                stdio: 'inherit',
                env: process.env,
            },
        );

        console.log(`Uploading report for ${projectName} to Currents...`);
        execSync(
            `npx currents upload --project-id=${process.env.CURRENTS_PROJECT_ID} --key=${process.env.CURRENTS_RECORD_KEY} --ci-build-id=${process.env.CURRENTS_CI_BUILD_ID} --report-dir "${currentsDir}"`,
            {
                stdio: 'inherit',
                env: process.env,
            },
        );
    } catch (error) {
        console.error(`Failed to upload to Currents for ${projectName}:`, error);
    }
};

const runDetox = (
    detoxConfiguration: string,
    env: NodeJS.ProcessEnv,
    headless: boolean,
    testFiles?: string[],
) =>
    new Promise<void>((resolve, reject) => {
        const args = ['detox', 'test', '--configuration', detoxConfiguration];
        if (headless) {
            args.push('--headless');
        }
        if (testFiles && testFiles.length > 0) {
            args.push(...testFiles);
        }

        const child = spawn('npx', args, { stdio: 'inherit', env });

        child.on('close', code => {
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(
                        `Detox tests for configuration ${detoxConfiguration} failed with exit code ${code}`,
                    ),
                );
            }
        });

        child.on('error', err => {
            reject(err);
        });
    });

const runProject = async (project: ProjectConfig, headless: boolean, testFiles: string[]) => {
    console.log(`\nStarting project: ${project.projectName}`);

    const env: NodeJS.ProcessEnv = {
        ...process.env,
        TDR_PROJECT_NAME: project.projectName,
    };

    if (project.model) {
        env.TDR_MODEL = project.model;
    }

    if (project.firmwareVersion) {
        env.TDR_FIRMWARE_VERSION = project.firmwareVersion;
    }

    if (project.grep) {
        env.TDR_GREP = project.grep;
    }

    await runDetox(project.target, env, headless, testFiles);
};

/**
 * Run a single project and return whether Detox itself crashed (exit code != 0
 * or spawn error), independently of the JUnit report contents.
 */
const runProjectSafely = async (
    project: ProjectConfig,
    headless: boolean,
    testFiles: string[],
): Promise<boolean> => {
    try {
        await runProject(project, headless, testFiles);

        return false;
    } catch (error) {
        console.error(`Project ${project.projectName} failed:`, error);

        return true;
    }
};

const runAllProjects = async (
    projects: ProjectConfig[],
    headless: boolean,
    testFiles: string[],
    quarantinedActions: Action[] = [],
) => {
    const failedProjects: string[] = [];

    for (const project of projects) {
        const detoxFailed = await runProjectSafely(project, headless, testFiles);
        const hasRemainingFailures = await processJUnitReport(
            project.projectName,
            detoxFailed,
            project.grep,
            quarantinedActions,
        );
        uploadToCurrents(project.projectName);

        // A project fails only when the (post-quarantine) report still contains failures,
        // or when Detox crashed without producing a report at all.
        if (hasRemainingFailures) {
            failedProjects.push(project.projectName);
        }
    }

    if (failedProjects.length > 0) {
        console.error('\nThe following projects failed:');
        failedProjects.forEach(name => console.error(`- ${name}`));
        process.exit(1);
    } else {
        console.log('\nAll projects passed successfully');
    }
};

const { configPath, shard, totalShards, headless, quarantine, projects, testFiles } = parseArgs();

const config = require(configPath) as RunnerConfig;
console.log(`Loaded config with ${config.projects.length} projects`);

const projectsToRun = projects
    ? config.projects.filter(p => projects.includes(p.projectName))
    : config.projects;

if (projectsToRun.length === 0) {
    if (projects) {
        console.error(`Error: No projects found matching: ${projects.join(', ')}`);
        console.error('Available projects:', config.projects.map(p => p.projectName).join(', '));
        process.exit(1);
    } else {
        console.warn('No projects found in config.');
        process.exit(0);
    }
}

const allFiles = testFiles && testFiles.length > 0 ? testFiles : getJestTestFiles();

const shardingEnabled = shard !== undefined && totalShards !== undefined;
const shardedFiles = shardingEnabled
    ? allFiles.filter((_, index) => index % totalShards === shard)
    : allFiles;

if (shardedFiles.length === 0) {
    console.log('No test files assigned to this shard. Exiting.');
    process.exit(0);
}

if (shardingEnabled) {
    console.log(`Sharding enabled. Running shard ${shard} of ${totalShards} shards.`);
    console.log(
        `This shard will run ${shardedFiles.length} of ${allFiles.length} available test files.`,
    );
}

void (async () => {
    const quarantinedActions = quarantine ? await fetchQuarantinedActions() : [];

    await runAllProjects(projectsToRun, headless, shardedFiles, quarantinedActions);
})();
