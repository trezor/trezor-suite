// Reserves a new @trezor/* package name on the npm registry and configures GitHub Actions as its
// trusted publisher, so that "[Release] Connect NPM" can publish it over OIDC.
//
// This has to be run once per new package, locally, by a maintainer with npm publish rights:
//
//     yarn reserve-npm-package network-tron
//
// Pass --dry-run to see what would be published and which trusted publisher would be configured,
// without touching the registry.
//
// It cannot be automated in CI: npm refuses to configure a trusted publisher for a package that
// does not exist yet, and `npm trust` requires account-level 2FA (it rejects tokens with 2FA
// bypass), so a human has to be in the loop either way.
//
// The placeholder is published as 0.0.0-reserved under the `reserved` dist tag, which keeps the
// package uninstallable until the release workflow publishes the first real version.

import child_process from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { isPackageOnNpmRegistry } from './npm-registry.js';
import { getTrezorPackageDir } from './trezor-package-path.js';

const ROOT = path.join(import.meta.dirname, '..', '..');

const PLACEHOLDER_VERSION = '0.0.0-reserved';
const PLACEHOLDER_DIST_TAG = 'reserved';

// Trusted publisher of every @trezor/* package released from the connect release workflow.
const GITHUB_REPOSITORY = 'trezor/trezor-suite';
const RELEASE_WORKFLOW_FILE = 'release-connect-npm.yml';
const RELEASE_ENVIRONMENT = 'production-connect';

// `npm trust` was introduced in npm@11.15.0, which may be newer than the npm bundled with .nvmrc Node.
const MINIMAL_NPM_MAJOR_WITH_TRUST = 11;
const MINIMAL_NPM_MINOR_WITH_TRUST = 15;

const run = ({ command, args, cwd = ROOT, isFatal = true }) => {
    console.log(`\n$ ${command} ${args.join(' ')}\n`);

    const { status, error } = child_process.spawnSync(command, args, { cwd, stdio: 'inherit' });

    if (error) {
        throw error;
    }

    if (status !== 0 && isFatal) {
        throw new Error(`"${command} ${args.join(' ')}" failed with exit code ${status}`);
    }

    return status === 0;
};

// `npm trust` lives in a newer npm than the one bundled with our Node version, in which case we run
// it through npx instead of asking the maintainer to upgrade their global npm.
const getNpmCommandWithTrust = () => {
    const { stdout } = child_process.spawnSync('npm', ['--version'], { encoding: 'utf-8' });
    const npmVersion = stdout.trim();
    const [major, minor] = npmVersion.split('.').map(Number);
    const hasTrustCommand =
        major > MINIMAL_NPM_MAJOR_WITH_TRUST ||
        (major === MINIMAL_NPM_MAJOR_WITH_TRUST && minor >= MINIMAL_NPM_MINOR_WITH_TRUST);

    if (hasTrustCommand) {
        return { command: 'npm', args: [] };
    }

    console.log(
        `Local npm ${npmVersion} has no "trust" command (npm@${MINIMAL_NPM_MAJOR_WITH_TRUST}.${MINIMAL_NPM_MINOR_WITH_TRUST}.0+ needed), running it through npx.`,
    );

    return { command: 'npx', args: ['-y', 'npm@latest'] };
};

const getNpmUsername = () => {
    const { status, stdout } = child_process.spawnSync('npm', ['whoami'], { encoding: 'utf-8' });

    return status === 0 ? stdout.trim() : undefined;
};

const getTrustArgs = packageName => [
    'trust',
    'github',
    packageName,
    '--repository',
    GITHUB_REPOSITORY,
    '--file',
    RELEASE_WORKFLOW_FILE,
    '--environment',
    RELEASE_ENVIRONMENT,
    '--allow-publish',
];

const createPlaceholderPackage = ({ packageName, homepage }) => {
    const placeholderPath = fs.mkdtempSync(path.join(os.tmpdir(), 'trezor-reserve-npm-'));

    const placeholderPackageJSON = {
        name: packageName,
        version: PLACEHOLDER_VERSION,
        description: `Placeholder reserving the ${packageName} name on npm. Not meant to be installed.`,
        license: 'SEE LICENSE IN LICENSE.md',
        repository: { type: 'git', url: `git://github.com/${GITHUB_REPOSITORY}.git` },
        homepage,
        publishConfig: { access: 'public' },
    };

    fs.writeFileSync(
        path.join(placeholderPath, 'package.json'),
        `${JSON.stringify(placeholderPackageJSON, null, 4)}\n`,
    );
    fs.writeFileSync(
        path.join(placeholderPath, 'README.md'),
        [
            `# ${packageName}`,
            '',
            `Placeholder reserving the \`${packageName}\` name so that it can be published from CI`,
            `over OIDC. The first real version is published from ${GITHUB_REPOSITORY}.`,
            '',
        ].join('\n'),
    );
    fs.copyFileSync(path.join(ROOT, 'LICENSE.md'), path.join(placeholderPath, 'LICENSE.md'));

    return placeholderPath;
};

// A first publish may set the `latest` dist tag even though we publish under a different one. We
// remove it so that `npm install` of the package keeps failing until the first real release.
const removeLatestDistTag = packageName => {
    const { stdout } = child_process.spawnSync(
        'npm',
        ['view', packageName, 'dist-tags', '--json'],
        { encoding: 'utf-8' },
    );

    let distTags = {};
    try {
        distTags = JSON.parse(stdout);
    } catch {
        console.warn(`Could not read dist tags of ${packageName}, skipping the "latest" cleanup.`);

        return;
    }

    if (!distTags.latest) {
        return;
    }

    const isRemoved = run({
        command: 'npm',
        args: ['dist-tag', 'rm', packageName, 'latest'],
        isFatal: false,
    });

    if (!isRemoved) {
        console.warn(
            `Could not remove the "latest" dist tag, do it manually: npm dist-tag rm ${packageName} latest`,
        );
    }
};

const reserveNpmPackage = async () => {
    const scriptArguments = process.argv.slice(2);
    const isDryRun = scriptArguments.includes('--dry-run');
    const [packageNameArgument] = scriptArguments.filter(argument => argument !== '--dry-run');

    if (!packageNameArgument) {
        throw new Error(
            'Reserve script requires 1 parameter: package name, e.g. "yarn reserve-npm-package network-tron"',
        );
    }

    const packageDirectoryName = packageNameArgument.replace('@trezor/', '');
    const packageJSONPath = path.join(getTrezorPackageDir(packageDirectoryName), 'package.json');

    if (!fs.existsSync(packageJSONPath)) {
        throw new Error(`${packageJSONPath} not found, is "${packageDirectoryName}" correct?`);
    }

    const {
        name: packageName,
        homepage,
        publishConfig,
        private: isPrivate,
    } = JSON.parse(fs.readFileSync(packageJSONPath, 'utf-8'));

    if (isPrivate || !publishConfig) {
        throw new Error(`${packageName} is not published to npm, there is nothing to reserve.`);
    }

    const { command, args } = getNpmCommandWithTrust();
    const trustCommand = [command, ...args, ...getTrustArgs(packageName)].join(' ');

    if (await isPackageOnNpmRegistry(packageName)) {
        console.log(`${packageName} already exists on npm, no reservation needed.`);
        console.log(
            `\nIf the release still fails with "No authentication configured for request", its trusted publisher is missing:\n\n    ${trustCommand}\n`,
        );

        return;
    }

    const npmUsername = getNpmUsername();

    if (!npmUsername && !isDryRun) {
        throw new Error('Not logged in to npm, run "npm login" first.');
    }

    const npmAccount = npmUsername ? ` as npm user ${npmUsername}` : '';

    console.log(`Reserving ${packageName} on npm as ${PLACEHOLDER_VERSION}${npmAccount}.`);

    const placeholderPath = createPlaceholderPackage({ packageName, homepage });

    try {
        run({
            command: 'npm',
            args: [
                'publish',
                '--tag',
                PLACEHOLDER_DIST_TAG,
                '--access',
                'public',
                ...(isDryRun ? ['--dry-run'] : []),
            ],
            cwd: placeholderPath,
        });
    } finally {
        fs.rmSync(placeholderPath, { recursive: true, force: true });
    }

    if (isDryRun) {
        console.log(`\nWould configure the trusted publisher with:\n\n    ${trustCommand}\n`);

        return;
    }

    removeLatestDistTag(packageName);

    console.log('\nConfiguring GitHub Actions as the trusted publisher.');
    run({ command, args: [...args, ...getTrustArgs(packageName)] });

    console.log(
        [
            '',
            `${packageName} is reserved and can now be published by "[Release] Connect NPM".`,
            '',
            'Verify with:',
            `    ${[command, ...args, 'trust', 'list', packageName].join(' ')}`,
            '',
        ].join('\n'),
    );
};

reserveNpmPackage();
