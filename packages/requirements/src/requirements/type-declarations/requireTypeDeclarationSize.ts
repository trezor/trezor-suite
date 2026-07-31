import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { type WalkDirectoryOptions, normalizePath, walkDirectory } from '../../fileSystem';
import { listAllWorkspaces } from '../../workspaces';
import type { Requirement } from '../Requirement';

const kibToBytes = (sizeKib: number) => sizeKib * 1024;

export const MAX_DECLARATION_SIZE_BYTES = kibToBytes(50);
export const MIN_DECLARATION_RATIO_SIZE_BYTES = kibToBytes(5);
export const MAX_DECLARATION_SOURCE_RATIO = 5;

const TYPE_DECLARATION_SIZE_FAILURE_GUIDANCE = [
    'Large generated declarations slow TypeScript and IDE performance.',
    'To fix this, reduce the public type surface; usually, add an explicit type or return type to the source export so TypeScript does not expand inferred dependency types.',
    'Regenerate declarations with `yarn type-check --output-style=stream`, then rerun `yarn requirements:verify --only=type-declaration-size`.',
    'Only add the declaration to `LEGIT_BIG_FILES` if its size is intrinsic to generated code or static data.',
].join('\n      ');

const KNOWN_DECLARATION_SIZE_VIOLATIONS_LOCATION =
    '`KNOWN_DECLARATION_SIZE_VIOLATIONS` in `packages/requirements/src/requirements/type-declarations/requireTypeDeclarationSize.ts`';

const addKnownViolationFailureGuidance = (error: string, correction: string) =>
    [
        error,
        `This path has a temporary exception in ${KNOWN_DECLARATION_SIZE_VIOLATIONS_LOCATION}.`,
        `${correction}, then rerun \`yarn requirements:verify --only=type-declaration-size\`.`,
    ].join('\n      ');

// Generated declarations and static datasets whose size is intrinsic to their content.
const LEGIT_BIG_FILES = new Set<string>([
    'packages/connect-data/libDev/src/map-releases.d.ts',
    'packages/connect/libDev/e2e/__fixtures__/cardanoSignTransaction.d.ts',
    'packages/icons/libDev/src/index.d.ts',
    'packages/protobuf/libDev/src/definitions/index.d.ts',
    'packages/protobuf/libDev/src/definitions/messages-bitcoin.d.ts',
    'packages/protobuf/libDev/src/definitions/messages-stellar.d.ts',
    'suite-common/earn-stablecoin-defs/libDev/src/api/index.d.ts',
    'suite-common/icons/libDev/src/icons.d.ts',
    'suite-common/message-system/libDev/files/config.v1.d.ts',
    'suite-native/intl/libDev/src/messages.d.ts',
    'suite-native/intl/libDev/src/Translate.d.ts',
    'suite/intl/libDev/src/messages.d.ts',
]);

// Existing violations to fix incrementally. The requirement reports entries once they can be removed.
const KNOWN_DECLARATION_SIZE_VIOLATIONS = new Set<string>([
    'packages/connect-common/libDev/src/types/api/cardano/common.d.ts',
    'packages/connect-common/libDev/src/types/api/internal/index.d.ts',
    'suite-common/calldata/libDev/src/calldata.d.ts',
    'suite-common/calldata/libDev/src/verifier.d.ts',
    'suite-common/earn-staking-api/libDev/src/staking/services/index.d.ts',
    'suite-common/receive/libDev/src/receiveSlice.d.ts',
]);

const isDeclarationFile = (fileName: string) => /\.d\.[cm]?ts$/.test(fileName);

const isDeclarationFileFilter: WalkDirectoryOptions['fileFilter'] = ({ entry }) =>
    entry.isFile() && isDeclarationFile(entry.name);
const listDeclarationFiles = (directory: string): ReadonlyArray<string> =>
    [...walkDirectory(directory, { fileFilter: isDeclarationFileFilter })].map(({ path }) => path);

const formatSize = (sizeBytes: number) => {
    if (sizeBytes < 1024) return `${sizeBytes} B`;

    const sizeKib = sizeBytes / 1024;

    return `${Number.isInteger(sizeKib) ? sizeKib : sizeKib.toFixed(1)} KiB`;
};

const formatRatio = (ratio: number) =>
    Number.isInteger(ratio) ? ratio.toString() : ratio.toFixed(1);

const addFailureGuidance = (error: string) =>
    `${error}\n      ${TYPE_DECLARATION_SIZE_FAILURE_GUIDANCE}`;

const DECLARATION_SOURCE_EXTENSIONS = [
    { declarationExtension: '.d.ts', sourceExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
    { declarationExtension: '.d.mts', sourceExtensions: ['.mts', '.mjs'] },
    { declarationExtension: '.d.cts', sourceExtensions: ['.cts', '.cjs'] },
] as const;

type DeclarationFileContext = {
    repoRoot: string;
    workspaceDirectory: string;
    declarationOutputDirectory: string;
    declarationFile: string;
};

const findSourceFileFromDeclarationMap = (declarationFile: string) => {
    const declarationMapFile = `${declarationFile}.map`;

    if (!existsSync(declarationMapFile)) return undefined;

    try {
        const declarationMap: unknown = JSON.parse(readFileSync(declarationMapFile, 'utf8'));

        if (typeof declarationMap !== 'object' || declarationMap === null) return undefined;

        const { sourceRoot, sources } = declarationMap as Record<string, unknown>;

        if (sourceRoot !== undefined && typeof sourceRoot !== 'string') return undefined;
        if (!Array.isArray(sources)) return undefined;

        return sources
            .filter((source): source is string => typeof source === 'string')
            .map(source => join(dirname(declarationMapFile), sourceRoot ?? '', source))
            .find(existsSync);
    } catch {
        return undefined;
    }
};

const findSourceFile = ({
    workspaceDirectory,
    declarationOutputDirectory,
    declarationFile,
}: Omit<DeclarationFileContext, 'repoRoot'>) => {
    const sourceFileFromDeclarationMap = findSourceFileFromDeclarationMap(declarationFile);

    if (sourceFileFromDeclarationMap) return sourceFileFromDeclarationMap;

    const relativeDeclarationPath = relative(declarationOutputDirectory, declarationFile);
    const extensionMapping = DECLARATION_SOURCE_EXTENSIONS.find(({ declarationExtension }) =>
        relativeDeclarationPath.endsWith(declarationExtension),
    );

    if (!extensionMapping) return undefined;

    const sourcePathWithoutExtension = relativeDeclarationPath.slice(
        0,
        -extensionMapping.declarationExtension.length,
    );

    return extensionMapping.sourceExtensions
        .map(extension => join(workspaceDirectory, `${sourcePathWithoutExtension}${extension}`))
        .find(existsSync);
};

const getViolation = (context: DeclarationFileContext) => {
    const { repoRoot, declarationFile } = context;
    const declarationPath = normalizePath(relative(repoRoot, declarationFile));
    const declarationSizeBytes = statSync(declarationFile).size;

    if (declarationSizeBytes > MAX_DECLARATION_SIZE_BYTES) {
        return addFailureGuidance(
            `${declarationPath} is ${formatSize(
                declarationSizeBytes,
            )}; maximum is ${formatSize(MAX_DECLARATION_SIZE_BYTES)}.`,
        );
    }

    if (declarationSizeBytes <= MIN_DECLARATION_RATIO_SIZE_BYTES) return undefined;

    const sourceFile = findSourceFile(context);

    if (!sourceFile) return undefined;

    const sourceSizeBytes = statSync(sourceFile).size;

    if (sourceSizeBytes === 0) return undefined;

    const declarationSourceRatio = declarationSizeBytes / sourceSizeBytes;

    if (declarationSourceRatio <= MAX_DECLARATION_SOURCE_RATIO) return undefined;

    const sourcePath = normalizePath(relative(repoRoot, sourceFile));

    return addFailureGuidance(
        `${declarationPath} is ${formatSize(declarationSizeBytes)}, ${formatRatio(
            declarationSourceRatio,
        )}x the size of ${sourcePath} (${formatSize(
            sourceSizeBytes,
        )}); maximum is ${MAX_DECLARATION_SOURCE_RATIO}x for declarations larger than ${formatSize(
            MIN_DECLARATION_RATIO_SIZE_BYTES,
        )}.`,
    );
};

type CreateRequireTypeDeclarationSizeParams = {
    legitBigFiles: ReadonlySet<string>;
    knownDeclarationSizeViolations: ReadonlySet<string>;
};

const verifyDeclarationFile = (
    context: DeclarationFileContext,
    { legitBigFiles, knownDeclarationSizeViolations }: CreateRequireTypeDeclarationSizeParams,
) => {
    const declarationPath = normalizePath(relative(context.repoRoot, context.declarationFile));

    if (legitBigFiles.has(declarationPath)) return undefined;

    const violation = getViolation(context);
    const isKnownViolation = knownDeclarationSizeViolations.has(declarationPath);

    if (isKnownViolation && violation === undefined) {
        return addKnownViolationFailureGuidance(
            `${declarationPath} no longer violates declaration size limits. The generated declaration is now within the configured limits, so its temporary exception is stale.`,
            'Remove this path from the set',
        );
    }

    if (isKnownViolation) return undefined;

    return violation;
};

// Creator pattern is used to separate the static snapshots LEGIT_BIG_FILES and KNOWN_DECLARATION_SIZE_VIOLATIONS
// from unit tests, because the snapshots may change and break the tests.
export const createRequireTypeDeclarationSize = ({
    legitBigFiles,
    knownDeclarationSizeViolations,
}: CreateRequireTypeDeclarationSizeParams): Requirement<'repo'> => ({
    name: 'type-declaration-size',
    scope: 'repo',
    runByDefault: false,
    verify: ({ repoRoot }) => {
        const declarationOutputDirectories = listAllWorkspaces(repoRoot)
            .map(workspace => ({
                workspaceDirectory: workspace.dir,
                declarationOutputDirectory: join(workspace.dir, 'libDev'),
            }))
            .filter(({ declarationOutputDirectory }) => existsSync(declarationOutputDirectory));
        const declarationFiles = declarationOutputDirectories.flatMap(declarationOutput =>
            listDeclarationFiles(declarationOutput.declarationOutputDirectory).map(
                declarationFile => ({ ...declarationOutput, declarationFile }),
            ),
        );
        const declarationPaths = new Set(
            declarationFiles.map(({ declarationFile }) =>
                normalizePath(relative(repoRoot, declarationFile)),
            ),
        );
        const builtDeclarationOutputPaths = declarationOutputDirectories.map(
            ({ declarationOutputDirectory }) =>
                normalizePath(relative(repoRoot, declarationOutputDirectory)),
        );
        const errors = declarationFiles
            .map(declarationFile =>
                verifyDeclarationFile(
                    { repoRoot, ...declarationFile },
                    { legitBigFiles, knownDeclarationSizeViolations },
                ),
            )
            .filter(error => error !== undefined);

        for (const declarationPath of knownDeclarationSizeViolations) {
            const isWorkspaceBuilt = builtDeclarationOutputPaths.some(outputPath =>
                declarationPath.startsWith(`${outputPath}/`),
            );

            if (isWorkspaceBuilt && !declarationPaths.has(declarationPath)) {
                errors.push(
                    addKnownViolationFailureGuidance(
                        `${declarationPath} was not emitted at the expected path. The declaration was removed or moved, so its temporary exception is stale.`,
                        'Remove the path from the set if the declaration was deleted, or update it if the declaration moved',
                    ),
                );
            }
        }

        return Promise.resolve(errors.sort());
    },
});

export const requireTypeDeclarationSize = createRequireTypeDeclarationSize({
    legitBigFiles: LEGIT_BIG_FILES,
    knownDeclarationSizeViolations: KNOWN_DECLARATION_SIZE_VIOLATIONS,
});
