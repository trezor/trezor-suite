#!/usr/bin/env node


/**
 * This runner is for:
 * @link the https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest
 * 
 * You need to add:
 * ```
 * {
 *   "jest.runMode": "deferred",
 *   "jest.jestCommandLine": "node ./scripts/vscode-jest-runner.cjs"
 * }
 * ```
 * 
 * Into the `.vscode/settings.json` to make it work.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const forwardedArgs = process.argv.slice(2);
const yarnRcPath = path.join(repoRoot, '.yarnrc.yml');

const getYarnExecutable = () => {
    if (fs.existsSync(yarnRcPath)) {
        const yarnRcContent = fs.readFileSync(yarnRcPath, 'utf8');
        const yarnPathMatch = yarnRcContent.match(/^yarnPath:\s+(.+)$/m);

        if (yarnPathMatch) {
            const yarnPath = yarnPathMatch[1].trim();

            return {
                command: process.execPath,
                baseArgs: [path.resolve(repoRoot, yarnPath)],
            };
        }
    }

    return {
        command: 'yarn',
        baseArgs: [],
    };
};

const runYarn = (args, options = {}) => {
    const yarn = getYarnExecutable();

    return spawnSync(yarn.command, [...yarn.baseArgs, ...args], {
        cwd: repoRoot,
        env: process.env,
        ...options,
    });
};

const parseWorkspaceList = () =>
    runYarn(['workspaces', 'list', '--json'], { encoding: 'utf8' }).stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));

const readPackageJson = workspaceLocation => {
    const packageJsonPath = path.join(repoRoot, workspaceLocation, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
        return undefined;
    }

    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
};

const getTestableWorkspaces = () =>
    parseWorkspaceList()
        .filter(workspace => workspace.location !== '.')
        .map(workspace => ({
            ...workspace,
            packageJson: readPackageJson(workspace.location),
        }))
        .filter(workspace => workspace.packageJson?.scripts?.['test:unit'])
        .map(({ packageJson, ...workspace }) => workspace)
        .sort((left, right) => right.location.length - left.location.length);

const normalizePathLikeArg = value => {
    if (!value || value.startsWith('-')) {
        return undefined;
    }

    if (path.isAbsolute(value)) {
        return path.relative(repoRoot, value).split(path.sep).join('/');
    }

    const resolvedFromRepoRoot = path.resolve(repoRoot, value);

    if (fs.existsSync(resolvedFromRepoRoot)) {
        return path.relative(repoRoot, resolvedFromRepoRoot).split(path.sep).join('/');
    }

    return value.split(path.sep).join('/');
};

const collectCandidateValues = args => {
    const values = [];

    for (let index = 0; index < args.length; index++) {
        const currentArg = args[index];
        const separatorIndex = currentArg.indexOf('=');
        const flag = separatorIndex === -1 ? currentArg : currentArg.slice(0, separatorIndex);
        const inlineValue =
            separatorIndex === -1 ? undefined : currentArg.slice(separatorIndex + 1);

        if (
            flag === '--runTestsByPath' ||
            flag === '--findRelatedTests' ||
            flag === '--testPathPattern' ||
            flag === '--testPathPatterns'
        ) {
            if (inlineValue) {
                values.push(inlineValue);
            } else if (args[index + 1]) {
                values.push(args[index + 1]);
                index += 1;
            }

            continue;
        }

        values.push(currentArg);
    }

    return values.map(normalizePathLikeArg).filter(Boolean);
};

const findTargetWorkspace = args => {
    const candidates = collectCandidateValues(args);

    return getTestableWorkspaces().find(workspace =>
        candidates.some(
            candidate =>
                candidate === workspace.location ||
                candidate.startsWith(`${workspace.location}/`) ||
                candidate.includes(`/${workspace.location}/`),
        ),
    );
};

const rewriteArgForWorkspace = (value, workspace) => {
    const normalizedValue = normalizePathLikeArg(value);

    if (!normalizedValue) {
        return value;
    }

    if (normalizedValue === workspace.location) {
        return '.';
    }

    if (normalizedValue.startsWith(`${workspace.location}/`)) {
        return normalizedValue.slice(workspace.location.length + 1);
    }

    return value;
};

const rewriteArgsForWorkspace = (args, workspace) =>
    args.map(currentArg => {
        const separatorIndex = currentArg.indexOf('=');

        if (separatorIndex === -1) {
            return rewriteArgForWorkspace(currentArg, workspace);
        }

        const flag = currentArg.slice(0, separatorIndex);
        const value = currentArg.slice(separatorIndex + 1);

        if (
            flag === '--runTestsByPath' ||
            flag === '--findRelatedTests' ||
            flag === '--testPathPattern' ||
            flag === '--testPathPatterns'
        ) {
            return `${flag}=${rewriteArgForWorkspace(value, workspace)}`;
        }

        return currentArg;
    });

const targetWorkspace = findTargetWorkspace(forwardedArgs);
const delegatedArgs = targetWorkspace
    ? rewriteArgsForWorkspace(forwardedArgs, targetWorkspace)
    : forwardedArgs;
const yarnArgs = targetWorkspace
    ? ['workspace', targetWorkspace.name, 'test:unit', ...delegatedArgs]
    : ['test:unit', ...delegatedArgs];

if (process.env.TREZOR_VSCODE_JEST_DEBUG === '1') {
    const yarn = getYarnExecutable();
    const targetLabel = targetWorkspace
        ? `${targetWorkspace.name} (${targetWorkspace.location})`
        : 'repo root';
    console.error(`[vscode-jest-runner] target: ${targetLabel}`);
    console.error(
        `[vscode-jest-runner] command: ${[yarn.command, ...yarn.baseArgs, ...yarnArgs].join(' ')}`,
    );
}

const result = runYarn(yarnArgs, {
    stdio: 'inherit',
});

if (result.error) {
    throw result.error;
}

process.exit(result.status ?? 1);
