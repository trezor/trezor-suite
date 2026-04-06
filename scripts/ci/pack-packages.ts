#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';

import { exec, getPackageDependencies } from './helpers';

const mkdir = util.promisify(fs.mkdir);
const existsDirectory = util.promisify(fs.exists);
const removeDir = util.promisify(fs.rm);
const writeFile = util.promisify(fs.writeFile);

const __dirname = import.meta.dirname;
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'tmp/packed-packages');

const walkFiles = async (directory: string): Promise<string[]> => {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async entry => {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                return walkFiles(fullPath);
            }

            return [fullPath];
        }),
    );

    return files.flat();
};

const escapeRegex = (value: string) => value.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

const pathPatternToRegExp = (relativePattern: string) => {
    const normalized = relativePattern.replaceAll('\\', '/');
    const escaped = escapeRegex(normalized).replaceAll('*', '.*');

    return new RegExp(`^${escaped}$`);
};

const collectPublishTargets = (value: unknown): string[] => {
    if (typeof value === 'string') {
        return [value];
    }

    if (!value || typeof value !== 'object') {
        return [];
    }

    return Object.values(value).flatMap(collectPublishTargets);
};

const validatePackagePublishTargets = async (pkg: string) => {
    const packageDir = path.join(ROOT_DIR, 'packages', pkg);
    const packageJsonPath = path.join(packageDir, 'package.json');
    const rawPackageJson = await fs.promises.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(rawPackageJson);

    const publishConfig = packageJson.publishConfig ?? {};
    const sections = [publishConfig.exports, publishConfig.browser, publishConfig['react-native']];
    const allTargets = sections
        .flatMap(collectPublishTargets)
        .filter((target): target is string => typeof target === 'string')
        .filter(target => target.startsWith('./lib') || target.startsWith('lib'));

    if (allTargets.length === 0) {
        return [] as string[];
    }

    const builtFiles = await walkFiles(packageDir);
    const builtFilesRelative = builtFiles.map(file =>
        path.relative(packageDir, file).replaceAll('\\', '/'),
    );

    const missingTargets = allTargets.filter(target => {
        const relativeTarget = target.replace(/^\.\//, '').replaceAll('\\', '/');
        const matcher = pathPatternToRegExp(relativeTarget);

        return !builtFilesRelative.some(file => matcher.test(file));
    });

    return Array.from(new Set(missingTargets)).sort();
};

const validatePublishTargets = async (packages: string[]) => {
    console.log('\nValidating publishConfig targets against built files...');

    const failures: { pkg: string; missingTargets: string[] }[] = [];

    for (const pkg of packages) {
        const missingTargets = await validatePackagePublishTargets(pkg);
        if (missingTargets.length > 0) {
            failures.push({ pkg, missingTargets });
        }
    }

    if (failures.length === 0) {
        console.log('Publish target validation passed.');

        return;
    }

    console.error('\nPublish target validation failed:');
    failures.forEach(({ pkg, missingTargets }) => {
        console.error(`  - ${pkg}`);
        missingTargets.forEach(target => {
            console.error(`    - missing target: ${target}`);
        });
    });

    throw new Error('One or more publishConfig targets do not match built files.');
};

const buildAllPackages = async () => {
    // Get dependencies for connect.
    const connectDeps = (await getPackageDependencies('connect')).update;

    const PACKAGES = [
        ...new Set([
            ...connectDeps,
            'connect',
            'connect-web',
            'connect-webextension',
            'connect-mobile',
        ]),
    ];

    if (await existsDirectory(OUTPUT_DIR)) {
        await removeDir(OUTPUT_DIR, { recursive: true });
    }
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log(`Packing ${PACKAGES.length} packages into ${OUTPUT_DIR}\n`);

    const results: {
        success: string[];
        failed: { pkg: string; error: string }[];
    } = { success: [], failed: [] };

    for (const pkg of PACKAGES) {
        const pkgDir = path.join(ROOT_DIR, 'packages', pkg);

        if (!(await existsDirectory(pkgDir))) {
            console.error(`Package not found: ${pkg}`);
            results.failed.push({ pkg, error: 'Package directory not found' });
            continue;
        }

        try {
            console.log(`Building ${pkg}...`);

            await exec('yarn', ['workspace', `@trezor/${pkg}`, 'build:lib']);

            console.log(`Packing ${pkg}...`);
            const outputFile = path.join(OUTPUT_DIR, `trezor-${pkg}.tgz`);
            await exec('yarn', ['workspace', `@trezor/${pkg}`, 'pack', '-o', outputFile]);

            console.log(`${pkg} → trezor-${pkg}.tgz\n`);
            results.success.push(pkg);
        } catch (error) {
            console.error(`Failed to pack ${pkg}: ${error.message}\n`);
            results.failed.push({ pkg, error: error.message });
        }
    }

    console.log('\n---------------');
    console.log(`Success: ${results.success.length}/${PACKAGES.length}`);
    if (results.failed.length > 0) {
        console.log(`Failed: ${results.failed.length}`);
        results.failed.forEach(({ pkg, error }) => {
            console.log(`   - ${pkg}: ${error}`);
        });
    }
    console.log(`\nOutput directory: ${OUTPUT_DIR}`);

    // Generate overrides.json so it can be used to build a project using the packed packages.
    const overrides: Record<string, string> = {};
    for (const pkg of results.success) {
        overrides[`@trezor/${pkg}`] = `file:${path.join(OUTPUT_DIR, `trezor-${pkg}.tgz`)}`;
    }

    const overridesPath = path.join(OUTPUT_DIR, 'overrides.json');
    await writeFile(overridesPath, JSON.stringify(overrides, null, 2));
    console.log(`\nGenerated overrides.json with ${results.success.length} packages`);

    if (results.failed.length > 0) {
        throw new Error('Packaging failed for one or more packages.');
    }

    await validatePublishTargets(results.success);
};

buildAllPackages();
