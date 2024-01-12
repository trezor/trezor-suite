/* eslint-disable camelcase */

const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

const { checkPackageDependencies, exec, commit, comment } = require('./helpers');

const args = process.argv.slice(2);

if (args.length < 1) throw new Error('Check npm dependencies requires 1 parameter: semver');
const [semver] = args;

const allowedSemvers = ['patch', 'minor'];
if (!allowedSemvers.includes(semver)) {
    throw new Error(`provided semver: ${semver} must be one of ${allowedSemvers.join(', ')}`);
}

const ROOT = path.join(__dirname, '..', '..');

const getGitCommitByPackageName = (packageName, maxCount = 10) =>
    exec('git', [
        'log',
        '--oneline',
        '--max-count',
        `${maxCount}`,
        '--pretty=tformat:"-   %s (%h)"',
        '--',
        `./packages/${packageName}`,
    ]);

const splitByNewlines = input => input.split('\n');

const findIndexByCommit = (commitArr, searchString) =>
    commitArr.findIndex(commit => commit.includes(searchString));

const initConnectRelease = async () => {
    const checkResult = await checkPackageDependencies('connect');

    const update = checkResult.update.map(package => package.replace('@trezor/', ''));
    const errors = checkResult.errors.map(package => package.replace('@trezor/', ''));

    if (update) {
        update.forEach(packageName => {
            const PACKAGE_PATH = path.join(ROOT, 'packages', packageName);
            const PACKAGE_JSON_PATH = path.join(PACKAGE_PATH, 'package.json');

            exec('yarn', ['bump', 'patch', `./packages/${packageName}/package.json`]);

            const rawPackageJSON = fs.readFileSync(PACKAGE_JSON_PATH);
            const packageJSON = JSON.parse(rawPackageJSON);
            const { version } = packageJSON;

            const packageGitLog = getGitCommitByPackageName(packageName, 1000);

            const commitsArr = packageGitLog.stdout.split('\n');

            const CHANGELOG_PATH = path.join(PACKAGE_PATH, 'CHANGELOG.md');

            const newCommits = [];
            for (const commit of commitsArr) {
                if (commit.includes(`npm-release: @trezor/${packageName}`)) {
                    break;
                }
                newCommits.push(commit.replaceAll('"', ''));
            }

            if (newCommits.length) {
                if (!fs.existsSync(CHANGELOG_PATH)) {
                    fs.writeFileSync(CHANGELOG_PATH, '');
                }

                let changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');

                changelog = `# ${version}\n\n${newCommits.join('\n')}\n\n${changelog}`;
                fs.writeFileSync(CHANGELOG_PATH, changelog, 'utf-8');

                exec('yarn', ['prettier', '--write', CHANGELOG_PATH]);
            }

            commit({
                path: PACKAGE_PATH,
                message: `npm-release: @trezor/${packageName} ${version}`,
            });
        });
    }

    const CONNECT_PACKAGE_PATH = path.join(ROOT, 'packages', 'connect');
    const CONNECT_PACKAGE_JSON_PATH = path.join(CONNECT_PACKAGE_PATH, 'package.json');

    const preBumpRawPackageJSON = fs.readFileSync(CONNECT_PACKAGE_JSON_PATH);
    const preBumpPackageJSON = JSON.parse(preBumpRawPackageJSON);
    const { version: preBumpVersion } = preBumpPackageJSON;

    exec('yarn', ['workspace', '@trezor/connect', `version:${semver}`]);

    const rawPackageJSON = fs.readFileSync(CONNECT_PACKAGE_JSON_PATH);
    const packageJSON = JSON.parse(rawPackageJSON);
    const { version } = packageJSON;

    const commitMessage = `npm-release: @trezor/connect ${version}`;
    const branchName = `npm-release/connect-${version}`;

    // Check if branch exists and if so, delete it.
    const branchExists = exec('git', ['branch', '--list', branchName]).stdout;
    if (branchExists) {
        throw new Error(`Branch ${branchName} already exists, delete it and call script again.`);
    }

    exec('git', ['checkout', '-b', branchName]);

    commit({
        path: ROOT,
        message: commitMessage,
    });

    exec('git', ['push', 'origin', branchName]);

    const ghPrCreateResult = exec('gh', [
        'pr',
        'create',
        '--repo',
        'trezor/trezor-suite',
        '--title',
        `${commitMessage}`,
        '--body-file',
        'docs/releases/connect-release.md',
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
    const connectGitLog = getGitCommitByPackageName('connect*', 1000);
    const [npmReleaseConnect, ...connectGitLogArr] = splitByNewlines(connectGitLog.stdout);
    const connectGitLogIndex = findIndexByCommit(
        connectGitLogArr,
        `npm-release: @trezor/connect ${preBumpVersion}`,
    );

    // Creating a comment only if there are commits to add since last connect release.
    if (connectGitLogIndex !== -1) {
        connectGitLogArr.splice(connectGitLogIndex, connectGitLogArr.length - connectGitLogIndex);
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
};

initConnectRelease();
