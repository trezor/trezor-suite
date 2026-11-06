/* eslint-disable no-console */
import * as path from 'path';

import { parseArgs } from './args';
import { getJestTestFiles } from './detox';
import { fetchQuarantinedActions } from './quarantine';
import { runAllProjects } from './runner';
import type { RunnerConfig } from './types';
import { getTestFilesMatchingGrep, shardProjectTestFiles } from '../support/testFileSelection';

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

const projectTestFiles = projectsToRun.map(project => {
    const matchingFiles = getTestFilesMatchingGrep({ testFiles: allFiles, grep: project.grep });
    console.log(
        `Project ${project.projectName}: ${matchingFiles.length} of ${allFiles.length} test files have tests matching its grep.`,
    );

    return { project, testFiles: matchingFiles };
});

const shardingEnabled = shard !== undefined && totalShards !== undefined;
const projectTestFilesToRun = shardingEnabled
    ? shardProjectTestFiles({ projectTestFiles, shard, totalShards })
    : projectTestFiles.filter(({ testFiles: matchingFiles }) => matchingFiles.length > 0);

if (projectTestFilesToRun.length === 0) {
    console.log(
        shardingEnabled
            ? 'No test files assigned to this shard. Exiting.'
            : 'No test files have tests matching the grep of any project. Exiting.',
    );
    process.exit(0);
}

if (shardingEnabled) {
    console.log(`Sharding enabled. Running shard ${shard} of ${totalShards} shards.`);
    projectTestFilesToRun.forEach(({ project, testFiles: shardFiles }) => {
        const fileNames = shardFiles.map(testFile => path.basename(testFile)).join(', ');
        console.log(
            `This shard will run ${shardFiles.length} test files of project ${project.projectName}: ${fileNames}`,
        );
    });
}

void (async () => {
    const quarantinedActions = quarantine ? await fetchQuarantinedActions() : [];

    await runAllProjects(projectTestFilesToRun, headless, quarantinedActions);
})();
