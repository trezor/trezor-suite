import { readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
    options: {
        'fixture-dir': { type: 'string' },
        scenario: { type: 'string' },
        version: { type: 'string' },
        'overrides-file': { type: 'string' },
        'packed-dir': { type: 'string' },
        'with-type-check': { type: 'boolean', default: false },
    },
});

const fixtureDir = values['fixture-dir'];
const { scenario, version } = values;
const overridesFile = values['overrides-file'];
const packedDir = values['packed-dir'];
const withTypeCheck = Boolean(values['with-type-check']);

if (!fixtureDir || !scenario) {
    console.error('Usage: render-package-json --fixture-dir <dir> --scenario <name> [...]');
    process.exit(1);
}

const manifest = JSON.parse(readFileSync(resolve(fixtureDir, 'manifest.json'), 'utf8'));
const fixtureName = basename(fixtureDir);
const { rootPackage, main, extraDependencies = {} } = manifest;

if (!rootPackage) {
    console.error(`manifest.json for ${fixtureName} is missing "rootPackage"`);
    process.exit(1);
}

let rootPackageSource: string;
let overrides: Record<string, string> | undefined;

if (scenario === 'local') {
    if (!overridesFile || !packedDir) {
        console.error('local scenario requires --overrides-file and --packed-dir');
        process.exit(1);
    }
    const rawOverrides: Record<string, string> = JSON.parse(readFileSync(overridesFile, 'utf8'));
    const normalized = Object.fromEntries(
        Object.entries(rawOverrides).map(([name, path]) => {
            if (!path.startsWith('file:')) return [name, path];

            const tarball = basename(path.slice('file:'.length));

            return [name, `file:${join(packedDir, tarball)}`];
        }),
    );
    overrides = normalized;
    const resolvedRoot = normalized[rootPackage];
    if (!resolvedRoot) {
        console.error(`Missing override for ${rootPackage} in ${overridesFile}`);
        process.exit(1);
    }
    rootPackageSource = resolvedRoot;
} else if (scenario === 'registry-npm' || scenario === 'registry-yarn') {
    if (!version) {
        console.error('registry scenarios require --version');
        process.exit(1);
    }
    rootPackageSource = version;
} else {
    console.error(`Unknown scenario: ${scenario}`);
    process.exit(1);
}

const dependencies = {
    [rootPackage]: rootPackageSource,
    ...(extraDependencies.always ?? {}),
};
if (withTypeCheck) {
    Object.assign(dependencies, extraDependencies.withTypeCheck ?? {});
}

const pkg: Record<string, unknown> = {
    name: `${fixtureName}-fixture`,
    version: '1.0.0',
    private: true,
    type: 'module',
};
if (main) pkg.main = main;
pkg.dependencies = dependencies;
if (overrides) pkg.overrides = overrides;

console.log(JSON.stringify(pkg, null, 2));
