const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

const { checkPackageDependencies } = require('./check-npm-dependencies');

const ROOT = path.join(__dirname, '..', '..');

const commit = ({
    path,
    ROOT,
    message,
}) => {
    const gitAddResult = child_process.spawnSync(
        'git',
        ['add', path],
        {
            encoding: 'utf-8',
            cwd: ROOT,
        },
    );
    if (gitAddResult.status !== 0) {
        console.log(gitAddResult);
    }
    const gitCommitResult = child_process.spawnSync(
        'git',
        ['commit', '-m', `${message}`],
        {
            encoding: 'utf-8',
            cwd: ROOT,
        },
    );
    if (gitCommitResult.status !== 0) {
        console.log(gitCommitResult);
    }
}


const comment = ({
    prNumber,
    body,
    ROOT,
}) => {
    const ghPrCommentResult = child_process.spawnSync(
        'gh',
        [
            'pr', 'comment', `${prNumber}`, '--body', body        ],
        {
            encoding: 'utf-8',
            cwd: ROOT,
        },
    );
    if (ghPrCommentResult.status !== 0) {
        console.log(ghPrCommentResult);
    }
}
const initConnectRelease = async () => {
    // const checkResult = await checkPackageDependencies('connect');
    const checkResult = {
        update: ['@trezor/blockchain-link'],
        errors: [],
    };

    const update = checkResult.update.map(package => package.replace('@trezor/', ''));
    const errors = checkResult.errors.map(package => package.replace('@trezor/', ''));

    if (update) {
        for (let package of update) {
            const packageName = package.replace('@trezor/', '');
            const PACKAGE_PATH = path.join(ROOT, 'packages', packageName);
            const PACKAGE_JSON_PATH = path.join(PACKAGE_PATH, 'package.json');

            const bumpRes = child_process.spawnSync(
                'yarn',
                ['bump', 'patch', `./packages/${packageName}/package.json`],
                {
                    encoding: 'utf-8',
                    cwd: ROOT,
                },
            );

            if (bumpRes.status !== 0) {
                console.log('bumpRes', bumpRes);
            }

            const rawPackageJSON = fs.readFileSync(PACKAGE_JSON_PATH);
            const packageJSON = JSON.parse(rawPackageJSON);
            const { version } = packageJSON;

            const gitLogResult = child_process.spawnSync(
                'git',
                [
                    'log',
                    '--oneline',
                    '--max-count',
                    '1000',
                    '--pretty=tformat:"-   %s (%h)"',
                    '--',
                    `./packages/${packageName}`,
                ],
                {
                    encoding: 'utf-8',
                    cwd: ROOT,
                },
            );

            if (gitLogResult.stderr) {
            }
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
                ROOT,
                path: PACKAGE_PATH,
                message: `npm-release: @trezor/${packageName} ${version}`
            })
        }
    }
    const depsChecklist = update.reduce(
        (acc, packageName) =>
            `${acc}\n- [ ] [![NPM](https://img.shields.io/npm/v/@trezor/${packageName}.svg)](https://www.npmjs.org/package/@trezor/${packageName}) @trezor/${packageName}`,
        '',
    );

    console.log(depsChecklist);

    if (errors) {
    }

    const bumpConnectResult = child_process.spawnSync(
        'yarn',
        ['workspace', '@trezor/connect', 'version:patch'],
        {
            encoding: 'utf-8',
            cwd: ROOT,
        },
    );
    if (bumpConnectResult.status !== 0) {
        console.log(bumpConnectResult);
    }

    const PACKAGE_PATH = path.join(ROOT, 'packages', 'connect');
    const PACKAGE_JSON_PATH = path.join(PACKAGE_PATH, 'package.json');
    const rawPackageJSON = fs.readFileSync(PACKAGE_JSON_PATH);
    const packageJSON = JSON.parse(rawPackageJSON);
    const { version } = packageJSON;

  
    const commitMessage= `npm-release: @trezor/connect ${version}`
    const branchName = `npm-release/connect-${version}`;

    const gitCheckoutResult = child_process.spawnSync(
        'git',
        ['checkout', '-b', branchName],
        {
            encoding: 'utf-8',
            cwd: ROOT,
        },
    );
    if (gitCheckoutResult.status !== 0) {
        console.log(gitCheckoutResult);
    }
    
    commit({
        ROOT,
        path: ROOT,
        message: commitMessage,
    })


    const gitPushResult = child_process.spawnSync(
        'git',
        ['push', 'origin', branchName],
        {
            encoding: 'utf-8',
            cwd: ROOT,
        },
    );
    if (gitPushResult.status !== 0) {
        console.log(gitPushResult);
    }
    
    const ghPrCreateResult = child_process.spawnSync(
        'gh',
        ['pr', 'create', '--repo', 'trezor/trezor-suite', '--title',`${commitMessage}`, '--body-file' ,"docs/releases/connect-release.md", '--base' ,'develop', '--head', branchName],
        {
            encoding: 'utf-8',
            cwd: ROOT,
        },
    );
    if (ghPrCreateResult.status !== 0) {
        console.log(ghPrCreateResult);
    }

    console.log('ghPrCreateResult',ghPrCreateResult);
  
    const ghPrListResult = child_process.spawnSync(
        'gh',
        ['pr', 'list', '--repo', 'trezor/trezor-suite', '--head', `${branchName}`, '--json', 'number'],
        {
            encoding: 'utf-8',
            cwd: ROOT,
        },
    );
    if (ghPrListResult.status !== 0) {
        console.log('ghPrListResult', ghPrListResult);
    }

    console.log('ghPrListResult', ghPrListResult);

    // comment({
    //     ROOT,
    //     prNumber: ghPrListResult,
    //     body: `Deps error. one of the dependencies likely needs to be published for the first time: ${errors}`
    // })
};

initConnectRelease();
// bash --version

// yarn --immutable

// yarn workspace @c/connect version:"${1}"
// VERSION=$(jq -r '.version' < packages/connect/package.json)
// BRANCH_NAME="npm-release/connect-${VERSION}"
// git checkout -B "${BRANCH_NAME}"
// git add . && git commit -m "npm-release: @trezor/connect ${VERSION}" && git push origin "${BRANCH_NAME}" -f
// PR_TITLE="npm-release @trezor/connect ${VERSION}"
// gh pr create --repo trezor/trezor-suite --title "${PR_TITLE}" --body-file "docs/releases/connect-release.md" --base develop
// PR_NUM=$(gh pr list --repo trezor/trezor-suite --head "${BRANCH_NAME}" --json number | jq .[0].number)

// if [[ -n "${DEPS_ERRORS}" ]]; then
//   echo "deps error. one of the dependencies likely needs to be published for the first time"
//   echo "deps errors: ${DEPS_ERRORS}"
//   gh pr comment "${PR_NUM}" --body "Deps error. one of the dependencies likely needs to be published for the first time: ${DEPS_ERRORS}"
// fi

// if [[ -n "${DEPS_CHECKLIST}" ]]; then
//   echo "deps checklist: ${DEPS_CHECKLIST}"
//   gh pr comment "${PR_NUM}" --body "${DEPS_CHECKLIST}"
// fi

// echo "DONE"
