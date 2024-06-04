import { exec } from './helpers';

const { checkPackageDependencies } = require('./helpers');

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

const bumpConnect = async () => {
    try {
        const lasCommitHash = await exec('git', ['log', '-1', "--format='%H'"]);
        console.log('lasCommitHash', lasCommitHash.stdout);
        const currentBranch = await exec('git', ['branch', '--show-current']);
        console.log('currentBranch', currentBranch.stdout);

        const checkResult: { update: string[]; errors: string[] } = await checkPackageDependencies(
            'connect',
            deploymentType,
        );

        console.log('checkResult', checkResult);

        const update = checkResult.update.map((pkg: string) => pkg.replace('@trezor/', ''));
        const errors = checkResult.errors.map((pkg: string) => pkg.replace('@trezor/', ''));

        console.log('update', update);
        console.log('errors', errors);
    } catch (error) {
        console.log('error:', error);
    }
};

bumpConnect();
