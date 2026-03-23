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

const buildAllPackages = async () => {
    // Get dependencies for connect.
    const connectDeps = (await getPackageDependencies('connect')).update;

    const PACKAGES = [
        ...new Set([...connectDeps, 'connect', 'connect-web', 'connect-webextension']),
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
};

buildAllPackages();
