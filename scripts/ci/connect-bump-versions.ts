import path from 'path';
import fs from 'fs';

import { promisify } from 'util';
import { gettingNpmDistributionTags } from './helpers';

const readFile = promisify(fs.readFile);
const existsDirectory = promisify(fs.exists);
const writeFile = promisify(fs.writeFile);

const { checkPackageDependencies, exec, commit, comment } = require('./helpers');

const args = process.argv.slice(2);

if (args.length < 1) {
    throw new Error('Check npm dependencies requires 1 parameter: semver');
}
const [semver] = args;

const allowedSemvers = ['patch', 'minor', 'prerelease'];
if (!allowedSemvers.includes(semver)) {
    throw new Error(`provided semver: ${semver} must be one of ${allowedSemvers.join(', ')}`);
}

const deploymentType = semver === 'prerelease' ? 'canary' : 'stable';

const ROOT = path.join(__dirname, '..', '..');

const getGitCommitByPackageName = (packageName: string, maxCount = 10) =>
    exec('git', [
        'log',
        '--oneline',
        '--max-count',
        `${maxCount}`,
        '--pretty=tformat:"-   %s (%h)"',
        '--',
        `./packages/${packageName}`,
    ]);

const splitByNewlines = (input: string) => input.split('\n');

const findIndexByCommit = (commitArr: string[], searchString: string) =>
    commitArr.findIndex(commit => commit.includes(searchString));

type ConnectVersionMatrix = {
    package: string;
    stable: string;
    canary: string;
};

const tableToMarkdown = (table: ConnectVersionMatrix[], type: 'Package' | 'Deployment') => {
    let markdown = `| ${type} | Stable | Canary |\n`;
    markdown += '| :----: | :----: | :----:|\n';

    table.forEach(row => {
        markdown += `| ${row.package} | ${row.stable} | ${row.canary} |\n`;
    });

    return markdown;
};

const updateConnectChangelog = async (
    connectChangelogPath: string,
    stableVersion: string,
    canaryVersion: string,
) => {
    try {
        const stable = stableVersion;
        const canary = canaryVersion;

        const changelogContent = await readFile(connectChangelogPath, 'utf-8');
        const lines = changelogContent.split('\n');

        const oldContent = lines.slice(9).join('\n');

        const npmTable = [
            { package: 'npm @trezor/connect', stable, canary },
            { package: 'npm @trezor/connect-web', stable, canary },
            {
                package: 'npm @trezor/connect-webextension',
                stable,
                canary,
            },
        ];

        const connectExplorerTable = [{ package: 'connect.trezor.io/', stable, canary }];

        const markdownNpmTable = tableToMarkdown(npmTable, 'Package');
        const markdownConnectExplorerTable = tableToMarkdown(connectExplorerTable, 'Deployment');

        const updatedContent =
            markdownNpmTable + '\n' + markdownConnectExplorerTable + '\n' + oldContent;

        await writeFile(connectChangelogPath, updatedContent, 'utf-8');
    } catch (error) {
        console.error('Error updating CHANGELOG.md:', error);
    }
};

const bumpConnect = async () => {
    try {
        const checkResult: { update: string[]; errors: string[] } = await checkPackageDependencies(
            'connect',
            deploymentType,
        );

        console.log('checkResult', checkResult);

        const update = checkResult.update.map((pkg: string) => pkg.replace('@trezor/', ''));
        const errors = checkResult.errors.map((pkg: string) => pkg.replace('@trezor/', ''));

        if (update) {
            for (const packageName of update) {
                const PACKAGE_PATH = path.join(ROOT, 'packages', packageName);
                const PACKAGE_JSON_PATH = path.join(PACKAGE_PATH, 'package.json');

                await exec('yarn', ['bump', semver, `./packages/${packageName}/package.json`]);

                const rawPackageJSON = await readFile(PACKAGE_JSON_PATH, 'utf-8');
                const packageJSON = JSON.parse(rawPackageJSON);
                const { version } = packageJSON;

                const packageGitLog = await getGitCommitByPackageName(packageName, 1000);

                const commitsArr = packageGitLog.stdout.split('\n');

                const CHANGELOG_PATH = path.join(PACKAGE_PATH, 'CHANGELOG.md');

                const newCommits: string[] = [];
                for (const commit of commitsArr) {
                    if (commit.includes(`npm-release: @trezor/${packageName}`)) {
                        break;
                    }
                    newCommits.push(commit.replaceAll('"', ''));
                }

                if (newCommits.length) {
                    if (!(await existsDirectory(CHANGELOG_PATH))) {
                        await writeFile(CHANGELOG_PATH, '');
                    }

                    let changelog = await readFile(CHANGELOG_PATH, 'utf-8');

                    changelog = `# ${version}\n\n${newCommits.join('\n')}\n\n${changelog}`;
                    await writeFile(CHANGELOG_PATH, changelog, 'utf-8');

                    await exec('yarn', ['prettier', '--write', CHANGELOG_PATH]);
                }

                commit({
                    path: PACKAGE_PATH,
                    message: `npm-release: @trezor/${packageName} ${version}`,
                });
            }
        }

        const CONNECT_PACKAGE_PATH = path.join(ROOT, 'packages', 'connect');
        const CONNECT_PACKAGE_JSON_PATH = path.join(CONNECT_PACKAGE_PATH, 'package.json');
        const CONNECT_CHANGELOG_PATH = path.join(CONNECT_PACKAGE_PATH, 'CHANGELOG.md');

        const preBumpRawPackageJSON = await readFile(CONNECT_PACKAGE_JSON_PATH, 'utf-8');
        const preBumpPackageJSON = JSON.parse(preBumpRawPackageJSON);
        const { version: preBumpVersion } = preBumpPackageJSON;

        await exec('yarn', ['workspace', '@trezor/connect', `version:${semver}`]);

        const rawPackageJSON = await readFile(CONNECT_PACKAGE_JSON_PATH, 'utf-8');
        const packageJSON = JSON.parse(rawPackageJSON);
        const { version } = packageJSON;

        if (deploymentType === 'stable') {
            await updateConnectChangelog(CONNECT_CHANGELOG_PATH, version, '-');
        } else {
            const distributionTags = await gettingNpmDistributionTags('@trezor/connect');
            await updateConnectChangelog(CONNECT_CHANGELOG_PATH, distributionTags.latest, version);
        }

        await exec('yarn', ['prettier', '--write', CONNECT_CHANGELOG_PATH]);

        const commitMessage = `npm-release: @trezor/connect ${version}`;
        const branchName = `bump-versions/connect-${version}`;

        // Check if branch exists and if so, delete it.
        const branchExists = await exec('git', ['branch', '--list', branchName]).stdout;
        if (branchExists) {
            throw new Error(
                `Branch ${branchName} already exists, delete it and call script again.`,
            );
        }

        await exec('git', ['checkout', '-b', branchName]);

        commit({
            path: ROOT,
            message: commitMessage,
        });

        await exec('git', ['push', 'origin', branchName]);

        const ghPrCreateResult = await exec('gh', [
            'pr',
            'create',
            '--repo',
            'trezor/trezor-suite',
            '--title',
            `${commitMessage}`,
            '--body-file',
            'docs/releases/connect-bump-version.md',
            '--base',
            'develop',
            '--head',
            branchName,
        ]);

        const prNumber = ghPrCreateResult.stdout
            .replaceAll('\n', '')
            .replace('https://github.com/trezor/trezor-suite/pull/', '');

        if (errors.length) {
            comment({
                prNumber,
                body: `Deps error. one of the dependencies likely needs to be published for the first time: ${errors.join(
                    ', ',
                )}`,
            });
        }

        const depsChecklist = update.reduce(
            (acc, packageName) =>
                `${acc}\n- [ ] [![NPM](https://img.shields.io/npm/v/@trezor/${packageName}.svg)](https://www.npmjs.org/package/@trezor/${packageName}) @trezor/${packageName}`,
            '',
        );

        if (depsChecklist) {
            comment({
                prNumber,
                body: depsChecklist,
            });
        }

        // Adding list of commits form the connect* packages to help creating and checking connect CHANGELOG.
        const connectGitLog = await getGitCommitByPackageName('connect*', 1000);
        const [_npmReleaseConnect, ...connectGitLogArr] = splitByNewlines(connectGitLog.stdout);
        const connectGitLogIndex = findIndexByCommit(
            connectGitLogArr,
            `npm-release: @trezor/connect ${preBumpVersion}`,
        );

        // Creating a comment only if there are commits to add since last connect release.
        if (connectGitLogIndex !== -1) {
            connectGitLogArr.splice(
                connectGitLogIndex,
                connectGitLogArr.length - connectGitLogIndex,
            );
            // In array `connectGitLogArr` each item string contains " at the beginning and " at the end, let's remove those characters.
            const cleanConnectGitLogArr = connectGitLogArr.map(line => line.slice(1, -1));
            const connectGitLogText = cleanConnectGitLogArr.reduce(
                (acc, line) => `${acc}\n${line}`,
                '',
            );

            if (!connectGitLogText) {
                console.log('no changelog for @trezor/connect');
                return;
            }

            comment({
                prNumber,
                body: connectGitLogText,
            });
        }
    } catch (error) {
        console.log('error:', error);
    }
};

bumpConnect();
