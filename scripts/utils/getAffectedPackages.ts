import { execSync } from 'node:child_process';

export const getAffectedPackages = (): string[] => {
    let affectedPackages: string[] = [];

    try {
        const affectedPackagesOutput = execSync(
            `cd ${process.env.PROJECT_CWD} && yarn nx show projects --affected`,
            { encoding: 'utf-8' },
        );
        affectedPackages = affectedPackagesOutput.split('\n').map(pkg => pkg.trim());
    } catch (error) {
        console.error('Error getting affected packages:', error.toString());
        process.exit(1);
    }

    return affectedPackages;
};
