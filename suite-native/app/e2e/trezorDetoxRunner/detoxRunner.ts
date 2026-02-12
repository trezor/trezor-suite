/* eslint-disable no-console */
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import minimist from 'minimist';
import * as path from 'path';
import xml2js from 'xml2js';

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
    const argv = minimist(process.argv.slice(2));

    if (argv.help) {
        console.log(`
Usage: tsx e2e/trezorDetoxRunner/detoxRunner.ts --config <path> [options] [testFiles]

Options:
  --config <path>       Path to the runner config file (required)
  --project <name>      Project name to run (can be specified multiple times)
  --shard <n>           Current shard index (0-based)
  --totalShards <n>     Total number of shards
  --headless            Run tests in headless mode
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
        projects,
        testFiles,
    };
};

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

const processJUnitReport = async (projectName: string, grep?: string) => {
    if (!grep) return;

    const reportPath = path.resolve(process.cwd(), 'reports', `${projectName}-junit-report.xml`);

    if (!fs.existsSync(reportPath)) {
        console.warn(`Report not found at ${reportPath}`);

        return;
    }

    try {
        const xml = fs.readFileSync(reportPath, 'utf8');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xml);

        if (!result.testsuites || !result.testsuites.testsuite) {
            console.log(`No test suites found in report for ${projectName}.`);

            return;
        }

        const regex = new RegExp(grep);

        result.testsuites.testsuite.forEach((suite: any) => {
            if (!suite.testcase) return;

            suite.testcase = suite.testcase.filter((tc: any) => {
                const isSkipped = tc.skipped !== undefined;
                // Keep tests that were not skipped
                if (!isSkipped) return true;

                // For skipped tests, keep them only if they match the grep pattern
                // We check if the test name matches the regex.
                return regex.test(tc.$.name);
            });
        });

        const builder = new xml2js.Builder();
        const newXml = builder.buildObject(result);
        fs.writeFileSync(reportPath, newXml);
        console.log(`Processed and updated JUnit report for ${projectName}`);
    } catch (error) {
        console.error(`Failed to process JUnit report for ${projectName}:`, error);
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

const runAllProjects = async (
    projects: ProjectConfig[],
    headless: boolean,
    testFiles: string[],
) => {
    const failedProjects: string[] = [];

    for (const project of projects) {
        try {
            await runProject(project, headless, testFiles);
        } catch (error) {
            console.error(`Project ${project.projectName} failed:`, error);
            failedProjects.push(project.projectName);
        } finally {
            await processJUnitReport(project.projectName, project.grep);
            uploadToCurrents(project.projectName);
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

const { configPath, shard, totalShards, headless, projects, testFiles } = parseArgs();

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

runAllProjects(projectsToRun, headless, shardedFiles);
