import { A } from '@mobily/ts-belt';
import chalk from 'chalk';
import { execSync } from 'node:child_process';
import semver from 'semver';
import { getWorkspacesList } from './getWorkspacesList';

// Execute the command and split the output by newlines
const ourWorkspaces = getWorkspacesList();
const ourPackages = Object.keys(ourWorkspaces);

export const findPackageUsagesInMonorepo = (depName: string): string[] => {
    const whyOutput = execSync(`yarn why ${depName} --json`, { encoding: 'utf-8' });
    const whyOutputJson = whyOutput
        .trim()
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line));

    const directVersions = new Set<string>();
    const allVersions = new Set<string>();

    const isSpecificVersion = (version: string) => {
        // Regular expression to match specific versions like "7.1.2" or "^7.1.2"
        return /^(\^)?(\d+\.){2}\d+(-.*)?$/.test(version);
    };

    const getPackageName = (value: string) => {
        const parts = value.split('@');
        if (parts[0] === '') {
            // Scoped package
            return `@${parts[1].split(':')[0]}`;
        }

        return parts[0];
    };

    const extractVersion = (descriptor: string) => {
        if (descriptor.includes('#npm:')) {
            return descriptor.split('#npm:')[1];
        }

        return descriptor.split('@npm:')[1];
    };

    whyOutputJson.forEach(item => {
        if (item.children) {
            Object.entries(item.children).forEach(([childName, child]: [string, any]) => {
                if (
                    child.descriptor &&
                    (childName.startsWith(`${depName}@npm:`) ||
                        childName.startsWith(`${depName}@virtual:`))
                ) {
                    const version = extractVersion(child.descriptor);
                    if (isSpecificVersion(version)) {
                        allVersions.add(version);

                        // Check if dependency is used in one of our packages
                        const parentPackage = getPackageName(item.value);
                        if (ourPackages.includes(parentPackage)) {
                            directVersions.add(version);
                        }
                    }
                }
            });
        }
    });

    // If we found direct versions in ourPackages, return those
    if (directVersions.size > 0) {
        return Array.from(directVersions);
    }

    if (allVersions.size > 0) {
        console.log(
            chalk.yellow(
                `Package ${chalk.bold(depName)} is used in monorepo but not directly in our packages.`,
            ),
        );
    }

    // Otherwise, return all specific versions found
    return Array.from(allVersions);
};

export const getPackageVersionInMonorepo = (packageName: string) => {
    const packageVersionInMonorepo = findPackageUsagesInMonorepo(packageName);
    if (packageVersionInMonorepo.length === 0) {
        return null;
    }

    if (packageVersionInMonorepo.length === 1) {
        return packageVersionInMonorepo[0];
    }

    // remove ^ prefix only for semver comparison (it doesn't work)
    const cleanVersion = (version: string) => version.replace(/^[\^]/, '');

    const sortedVersions = A.sort(packageVersionInMonorepo, (a, b) => {
        return semver.compare(cleanVersion(a), cleanVersion(b));
    });

    return A.last(sortedVersions);
};

export const getLatestVersionFromNpm = (packageName: string) => {
    try {
        const npmInfo = execSync(`yarn npm info ${packageName} --json`, { encoding: 'utf-8' });
        const npmInfoJson = JSON.parse(npmInfo);

        return npmInfoJson.version as string;
    } catch (error) {
        console.error(chalk.red(`Failed to get latest version from NPM for ${packageName}`));

        return null;
    }
};
