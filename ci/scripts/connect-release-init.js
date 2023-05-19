const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

const { checkPackageDependencies } = require('./check-npm-dependencies');

const args = process.argv.slice(2);

// if (args.length < 1) throw new Error('Check npm dependencies requires 1 parameter: package name');
// const [packageName] = args;

// if (!packages.includes(packageName)) {
//     throw new Error(`provided package name: ${packageName} must be one of ${packages}`);
// }

const ROOT = path.join(__dirname, '..', '..');

const exec = (cmd, params) => {
    const res = child_process.spawnSync(cmd, params, {
        encoding: 'utf-8',
        cwd: ROOT,
    });
    if (res.status !== 0) {
        console.log(cmd, ...params)
        console.log(res);
    }
    return res;
};

const commit = ({ path, message }) => {
    exec('git', ['add', path]);
    exec('git', ['commit', '-m', `${message}`]);
};

const comment = ({ prNumber, body }) => {
    exec('gh', ['pr', 'comment', `${prNumber}`, '--body', body]);
};

const initConnectRelease = async () => {
    const checkResult = await checkPackageDependencies('connect');

    const update = checkResult.update.map(package => package.replace('@trezor/', ''));
    const errors = checkResult.errors.map(package => package.replace('@trezor/', ''));

    if (update) {
        for (let package of update) {
            const packageName = package.replace('@trezor/', '');
            const PACKAGE_PATH = path.join(ROOT, 'packages', packageName);
            const PACKAGE_JSON_PATH = path.join(PACKAGE_PATH, 'package.json');

            exec('yarn', ['bump', 'patch', `./packages/${packageName}/package.json`]);

            const rawPackageJSON = fs.readFileSync(PACKAGE_JSON_PATH);
            const packageJSON = JSON.parse(rawPackageJSON);
            const { version } = packageJSON;

            const gitLogResult = exec('git', [
                'log',
                '--oneline',
                '--max-count',
                '1000',
                '--pretty=tformat:"-   %s (%h)"',
                '--',
                `./packages/${packageName}`,
            ]);

            const commitsArr = gitLogResult.stdout.split('\n');

            const CHANGELOG_PATH = path.join(PACKAGE_PATH, 'CHANGELOG.md');
            if (!fs.existsSync(CHANGELOG_PATH)) {
                fs.writeFileSync(CHANGELOG_PATH, '');
            }

            let changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');

            const newCommits = [];
            for (let commit of commitsArr) {
                if (commit.includes(`npm-release: @trezor/${packageName}`)) {
                    break;
                }
                newCommits.push(commit.replaceAll('"', ''));
            }

            if (newCommits) {
                changelog = `# ${version}\n\n${newCommits.join('')}\n\n${changelog}`;
                fs.writeFileSync(CHANGELOG_PATH, changelog, 'utf-8');
            }

            commit({
                path: PACKAGE_PATH,
                message: `npm-release: @trezor/${packageName} ${version}`,
            });
        }
    }
   
    exec('yarn', ['workspace', '@trezor/connect', 'version:patch']);

    const PACKAGE_PATH = path.join(ROOT, 'packages', 'connect');
    const PACKAGE_JSON_PATH = path.join(PACKAGE_PATH, 'package.json');
    const rawPackageJSON = fs.readFileSync(PACKAGE_JSON_PATH);
    const packageJSON = JSON.parse(rawPackageJSON);
    const { version } = packageJSON;

    const commitMessage = `npm-release: @trezor/connect ${version}`;
    const branchName = `npm-release/connect-${version}`;

    exec('git', ['checkout', '-b', branchName]);

    commit({
        path: ROOT,
        message: commitMessage,
    });

    exec('git', ['push', 'origin', branchName]);

    // const ghPrCreateResult = exec('gh', [
    //     'pr',
    //     'create',
    //     '--repo',
    //     'trezor/trezor-suite',
    //     '--title',
    //     `${commitMessage}`,
    //     '--body-file',
    //     'docs/releases/connect-release.md',
    //     '--base',
    //     'develop',
    //     '--head',
    //     branchName,
    // ]);

    // const prNumber = ghPrCreateResult.stdout
    //     .replace('\n', '')
    //     .replace('https://github.com/trezor/trezor-suite/pull/', '');

    // console.log('ghPrCreateResult', ghPrCreateResult);

    // if (errors) {
    //     comment({
    //         prNumber,
    //         body: `Deps error. one of the dependencies likely needs to be published for the first time: ${errors}`,
    //     });
    // }

    // const depsChecklist = update.reduce(
    //     (acc, packageName) =>
    //         `${acc}\n- [ ] [![NPM](https://img.shields.io/npm/v/@trezor/${packageName}.svg)](https://www.npmjs.org/package/@trezor/${packageName}) @trezor/${packageName}`,
    //     '',
    // );

    // if (depsChecklist) {
    //     comment({
    //         prNumber,
    //         body: depsChecklist,
    //     });
    // }
};

initConnectRelease();
