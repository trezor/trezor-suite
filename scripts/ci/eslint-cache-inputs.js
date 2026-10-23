// Writes the step outputs that the ESLint cache steps of the `lint` job in check-code-validation.yml
// and of build-develop-eslint-cache.yml share, so that both use the same key and paths.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

// ESLint's own cache validation covers a file's content, the ESLint and Node versions and the
// resolved config, but not the implementation of a plugin or a local rule, nor what a rule reads
// from other files. The toolchain hash keys those out: the blob IDs of the toolchain files, and the
// manifest fields rules read, which yarn.lock misses when a dependency only moves to or from
// devDependencies. `import/no-extraneous-dependencies` reads the dependency sections and the import
// resolver reads `main`; the other fields are left out so that a version bump or a script change
// keeps the key.
const manifestFields = [
    'main',
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
    'bundleDependencies',
    'bundledDependencies',
];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });

const toolchainHash = createHash('sha256').update(
    git(
        'ls-files',
        '-s',
        '--',
        'yarn.lock',
        'eslint.config.mjs',
        'eslint-local-rules',
        'packages/eslint',
    ),
);

// `*/**` leaves out the root manifest, which no workspace lint reads.
const manifests = git('ls-files', '--', ':(glob)*/**/package.json').split('\n').filter(Boolean);

for (const manifest of manifests) {
    const content = JSON.parse(readFileSync(manifest, 'utf8'));
    toolchainHash.update(
        `${JSON.stringify([manifest, ...manifestFields.map(field => content[field] ?? null)])}\n`,
    );
}

// Listed one by one: a `**/.eslintcache` glob would walk node_modules, which a negated pattern does
// not prune, and would also archive the copies Nx keeps in `.nx/cache`.
const paths = manifests.map(manifest => `${dirname(manifest)}/.eslintcache`);

appendFileSync(
    process.env.GITHUB_OUTPUT,
    `toolchain=${toolchainHash.digest('hex')}\npaths<<EOF\n${paths.join('\n')}\nEOF\n`,
);
