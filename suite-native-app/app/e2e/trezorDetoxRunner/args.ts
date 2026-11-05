/* eslint-disable no-console */
import * as fs from 'fs';
import minimist from 'minimist';
import * as path from 'path';

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

export const parseArgs = () => {
    const argv = minimist(process.argv.slice(2), { boolean: ['headless', 'quarantine', 'help'] });

    if (argv.help) {
        console.log(`
Usage: tsx e2e/trezorDetoxRunner/index.ts --config <path> [options] [testFiles]

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

    const { shard, totalShards, headless, quarantine } = argv;
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
        headless,
        quarantine,
        projects,
        testFiles,
    };
};
