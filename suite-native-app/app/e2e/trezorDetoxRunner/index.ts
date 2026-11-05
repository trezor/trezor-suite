/* eslint-disable no-console */
import { parseArgs } from './args';
import { getJestTestFiles } from './detox';
import { fetchQuarantinedActions } from './quarantine';
import { runAllProjects } from './runner';
import type { RunnerConfig } from './types';

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
