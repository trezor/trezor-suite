/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import { SemVer } from 'semver';

const SUITE_ROOT = path.resolve(__dirname, '..', '..', '..', 'packages', 'suite');
const MIGRATIONS_DIR = path.join(SUITE_ROOT, 'src', 'storage', 'migrations', 'versions');
const CHANGELOG_PATH = path.join(SUITE_ROOT, 'src', 'storage', 'CHANGELOG.md');
const EXPORT_PATH = path.join(MIGRATIONS_DIR, 'index.ts');

function exit(msg: string): never {
    console.error(msg);
    process.exit(1);
}

function ensureDirExists(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function createMigrationFile(semver: SemVer) {
    const { major, minor, patch } = semver;

    const fileName = `${semver.version}.ts`;
    const filePath = path.join(MIGRATIONS_DIR, fileName);
    const exportIdentifier = `m${major}_${minor}_${patch}`;

    if (fs.existsSync(filePath)) {
        exit(`❌ Migration ${semver.version} already exists at ${filePath}`);
    }

    ensureDirExists(MIGRATIONS_DIR);
    if (!fs.existsSync(EXPORT_PATH)) {
        fs.writeFileSync(EXPORT_PATH, '', 'utf8');
    }

    const template = `\
import { createMigration } from '@suite/idb-migration-utils';

import { SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>("${semver.version}", (db, tx) => {
    // ⚠️  TODO: implement migration logic for v${semver.version}
});
`;

    fs.writeFileSync(filePath, template, 'utf8');
    console.log(`✅ Created ${filePath}`);

    const exportLine = `export { default as ${exportIdentifier} } from './${semver.version}';\n`;
    fs.appendFileSync(EXPORT_PATH, exportLine, 'utf8');
    console.log(`✅ Appended export to ${EXPORT_PATH}`);
}

function updateChangelog(semver: SemVer) {
    if (!fs.existsSync(CHANGELOG_PATH)) {
        console.warn(`CHANGELOG_PATH not found at ${CHANGELOG_PATH}; heading not added`);

        return;
    }

    const heading = `\n## ${semver.version}\n\n`;

    const raw = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    const lines = raw.split(/\r?\n/);
    const hPos = lines.findIndex(l => l.trimStart().startsWith('#'));
    const pos = hPos === -1 ? 0 : hPos + 1;

    lines.splice(pos, 0, heading.trimEnd());
    fs.writeFileSync(CHANGELOG_PATH, lines.join('\n'), 'utf8');

    console.log(`✅ Updated ${CHANGELOG_PATH} with new version entry`);
}

function getSuiteVersion(): string {
    const packageJsonPath = path.join(SUITE_ROOT, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        exit(`❌ package.json not found at ${packageJsonPath}`);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    return packageJson.suiteVersion;
}

function run() {
    const [, , argVersion] = process.argv;

    const version = argVersion || getSuiteVersion();

    if (!version) exit('Usage: yarn workspace @trezor/suite make:migration x.y.z');

    const semver = new SemVer(version);

    if (semver.prerelease.length > 0) {
        exit(`❌ Prerelease versions are not supported: ${semver.version}`);
    }

    createMigrationFile(semver);
    updateChangelog(semver);
}

run();
