import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

import { listAllWorkspaces } from '../../workspaces';
import type { Requirement } from '../Requirement';

const kibToBytes = (sizeKib: number) => sizeKib * 1024;

export const MAX_DECLARATION_SIZE_BYTES = kibToBytes(50);
export const MIN_DECLARATION_RATIO_SIZE_BYTES = kibToBytes(5);
export const MAX_DECLARATION_SOURCE_RATIO = 5;

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
    'packages/connect-common/libDev/src/types/api/callable.d.ts',
    'packages/connect-common/libDev/src/types/api/cardano/common.d.ts',
    'packages/connect-common/libDev/src/types/api/internal/index.d.ts',
    'packages/connect-common/libDev/src/types/api/stellar/common.d.ts',
    'packages/connect-electron/libDev/src/index.d.ts',
    'packages/device-authenticity/libDev/src/authenticateDeviceParams.d.ts',
    'suite-common/calldata/libDev/src/calldata.d.ts',
    'suite-common/calldata/libDev/src/verifier.d.ts',
    'suite-common/earn-stablecoin-api/libDev/src/hooks/useAllYieldOpportunities.d.ts',
    'suite-common/earn-staking-api/libDev/src/staking/services/index.d.ts',
    'suite-common/receive/libDev/src/receiveSlice.d.ts',
]);

const normalizePath = (filePath: string) => filePath.split(sep).join('/');

const isDeclarationFile = (fileName: string) => /\.d\.[cm]?ts$/.test(fileName);

const listDeclarationFiles = (directory: string): ReadonlyArray<string> => {
    const declarations: string[] = [];

    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const entryPath = join(directory, entry.name);

        if (entry.isDirectory()) {
            declarations.push(...listDeclarationFiles(entryPath));
        } else if (entry.isFile() && isDeclarationFile(entry.name)) {
            declarations.push(entryPath);
        }
    }

    return declarations;
};

const formatSize = (sizeBytes: number) => {
    if (sizeBytes < 1024) return `${sizeBytes} B`;

    const sizeKib = sizeBytes / 1024;

    return `${Number.isInteger(sizeKib) ? sizeKib : sizeKib.toFixed(1)} KiB`;
};

const formatRatio = (ratio: number) =>
    Number.isInteger(ratio) ? ratio.toString() : ratio.toFixed(1);

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
        return `${declarationPath} is ${formatSize(
            declarationSizeBytes,
        )}; maximum is ${formatSize(MAX_DECLARATION_SIZE_BYTES)}.`;
    }

    if (declarationSizeBytes <= MIN_DECLARATION_RATIO_SIZE_BYTES) return undefined;

    const sourceFile = findSourceFile(context);

    if (!sourceFile) return undefined;

    const sourceSizeBytes = statSync(sourceFile).size;

    if (sourceSizeBytes === 0) return undefined;

    const declarationSourceRatio = declarationSizeBytes / sourceSizeBytes;

    if (declarationSourceRatio <= MAX_DECLARATION_SOURCE_RATIO) return undefined;

    const sourcePath = normalizePath(relative(repoRoot, sourceFile));

    return `${declarationPath} is ${formatSize(declarationSizeBytes)}, ${formatRatio(
        declarationSourceRatio,
    )}x the size of ${sourcePath} (${formatSize(
        sourceSizeBytes,
    )}); maximum is ${MAX_DECLARATION_SOURCE_RATIO}x for declarations larger than ${formatSize(
        MIN_DECLARATION_RATIO_SIZE_BYTES,
    )}.`;
};

const verifyDeclarationFile = (context: DeclarationFileContext) => {
    const declarationPath = normalizePath(relative(context.repoRoot, context.declarationFile));

    if (LEGIT_BIG_FILES.has(declarationPath)) return undefined;

    const violation = getViolation(context);
    const isKnownViolation = KNOWN_DECLARATION_SIZE_VIOLATIONS.has(declarationPath);

    if (isKnownViolation && violation === undefined) {
        return `${declarationPath} no longer violates declaration size limits; remove it from known declaration size violations.`;
    }

    if (isKnownViolation) return undefined;

    return violation;
};

export const requireTypeDeclarationSize: Requirement<'repo'> = {
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
            .map(declarationFile => verifyDeclarationFile({ repoRoot, ...declarationFile }))
            .filter(error => error !== undefined);

        for (const declarationPath of KNOWN_DECLARATION_SIZE_VIOLATIONS) {
            const isWorkspaceBuilt = builtDeclarationOutputPaths.some(outputPath =>
                declarationPath.startsWith(`${outputPath}/`),
            );

            if (isWorkspaceBuilt && !declarationPaths.has(declarationPath)) {
                errors.push(
                    `${declarationPath} no longer exists; remove or update it in known declaration size violations.`,
                );
            }
        }

        return Promise.resolve(errors.sort());
    },
};
