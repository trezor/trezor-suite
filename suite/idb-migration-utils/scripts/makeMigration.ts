/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import { SemVer } from 'semver';

import { VersionInfo, parseIdbVersion } from '../src/parseIdbVersion';

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

function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSuiteVersion(): string {
    const packageJsonPath = path.join(SUITE_ROOT, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        exit(`❌ package.json not found at ${packageJsonPath}`);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const { suiteVersion } = packageJson;

    if (typeof suiteVersion !== 'string' || !suiteVersion.trim()) {
        exit('❌ suiteVersion not found in package.json or is not a valid string');
    }

    const version = suiteVersion.trim();

    try {
        new SemVer(version);
    } catch {
        exit(`❌ Invalid suiteVersion in package.json: "${version}"`);
    }

    return version;
}

function resolveAutoVersion() {
    const suiteVersion = getSuiteVersion();
    const suiteSemVer = new SemVer(suiteVersion);

    const migrationFiles = fs.existsSync(MIGRATIONS_DIR) ? fs.readdirSync(MIGRATIONS_DIR) : [];

    const base = escapeRegExp(suiteSemVer.version);
    const revisionsRegex = new RegExp(`^${base}(?:\\.(\\d+))?\\.ts$`);

    const revisions = migrationFiles
        .map(name => {
            const match = name.match(revisionsRegex);
            if (!match) return null;

            return match[1] ? Number(match[1]) : 0;
        })
        .filter((v): v is number => v !== null && Number.isInteger(v) && v >= 0 && v <= 255);

    const nextRevision = revisions.length ? Math.max(...revisions) + 1 : 0;

    if (nextRevision > 255) {
        exit(`❌ Maximum number of revisions (255) reached for version ${suiteSemVer.version}`);
    }

    const nextVersionString =
        nextRevision === 0 ? suiteSemVer.version : `${suiteSemVer.version}.${nextRevision}`;

    return parseIdbVersion(nextVersionString);
}

function createMigrationFile({ semver, revision, versionString }: VersionInfo) {
    const { major, minor, patch } = semver;

    const fileName = `${versionString}.ts`;
    const filePath = path.join(MIGRATIONS_DIR, fileName);
    const exportIdentifier =
        revision === 0 ? `m${major}_${minor}_${patch}` : `m${major}_${minor}_${patch}_${revision}`;

    if (fs.existsSync(filePath)) {
        exit(`❌ Migration ${versionString} already exists at ${filePath}`);
    }

    ensureDirExists(MIGRATIONS_DIR);
    if (!fs.existsSync(EXPORT_PATH)) {
        fs.writeFileSync(EXPORT_PATH, '', 'utf8');
    }

    const template = `\
import { createMigration } from '@suite/idb-migration-utils';

import { SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>("${versionString}", (db, tx) => {
    // ⚠️  TODO: implement migration logic for v${versionString}
});
`;

    fs.writeFileSync(filePath, template, 'utf8');
    console.log(`✅ Created ${filePath}`);

    const exportLine = `export { default as ${exportIdentifier} } from './${versionString}';\n`;

    const indexContent = fs.readFileSync(EXPORT_PATH, 'utf8');
    if (!indexContent.includes(exportLine)) {
        fs.appendFileSync(EXPORT_PATH, exportLine, 'utf8');
        console.log(`✅ Appended export to ${EXPORT_PATH}`);
    } else {
        console.log(`ℹ️  Export already present in ${EXPORT_PATH}, skipping append`);
    }
}

function updateChangelog({ semver, revision }: VersionInfo) {
    if (revision > 0) {
        console.log('ℹ️  Revision migration; changelog not updated');

        return;
    }

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

function run() {
    const [, , argVersion] = process.argv;

    try {
        const versionInfo = argVersion ? parseIdbVersion(argVersion) : resolveAutoVersion();

        createMigrationFile(versionInfo);
        updateChangelog(versionInfo);
    } catch (error) {
        exit(`❌ ${error instanceof Error ? error.message : String(error)}`);
    }
}

run();
