import { relative } from 'node:path';

import { normalizePath, walkDirectory } from '../../fileSystem';
import type { Requirement } from '../Requirement';

const LEGACY_TEST_DIRECTORIES = new Set(['test', 'tests', '__tests__']);
const IGNORED_DIRECTORY_NAMES = new Set([
    'node_modules',
    'lib',
    'libDev',
    'build',
    'dist',
    'coverage',
]);

const EXEMPT_TEST_PATH_PREFIXES = [
    'packages/connect/e2e/',
    'packages/request-manager/e2e/',
    'packages/transport-test/e2e/',
    'packages/trezor-user-env-link/e2e/',
    'packages/urls/tests/e2e/',
    'suite-native/app/e2e/',
    'suite/e2e/',
] as const;

const isTestFile = (fileName: string) =>
    /\.(?:test|spec)\.[^/]+$/.test(fileName) || fileName.endsWith('.type-test.ts');

const isExemptTestPath = (filePath: string) =>
    EXEMPT_TEST_PATH_PREFIXES.some(pathPrefix => filePath.startsWith(pathPrefix));

export const isTestColocationViolation = (filePath: string) => {
    const pathSegments = filePath.split('/');
    const fileName = pathSegments.at(-1);

    if (fileName === undefined || !isTestFile(fileName)) return false;
    if (isExemptTestPath(filePath)) return false;

    return pathSegments.some(pathSegment => LEGACY_TEST_DIRECTORIES.has(pathSegment));
};

export const findTestColocationViolations = (
    filePaths: ReadonlyArray<string>,
): ReadonlyArray<string> => [...new Set(filePaths.filter(isTestColocationViolation))].sort();

export const verifyTestColocation = (filePaths: ReadonlyArray<string>): ReadonlyArray<string> =>
    findTestColocationViolations(filePaths).map(
        violationPath =>
            `${violationPath} is a non-E2E test in a legacy test directory. ` +
            'Co-locate it with its source file.',
    );

const listWorkspaceTestFiles = (repoRoot: string, workspaceDir: string): ReadonlyArray<string> => {
    const testFiles: string[] = [];

    for (const { entry, path } of walkDirectory(workspaceDir, {
        shouldEnterDirectory: ({ entry: directory }) =>
            !IGNORED_DIRECTORY_NAMES.has(directory.name),
    })) {
        if ((!entry.isFile() && !entry.isSymbolicLink()) || !isTestFile(entry.name)) {
            continue;
        }

        testFiles.push(normalizePath(relative(repoRoot, path)));
    }

    return testFiles;
};

export const requireTestColocation: Requirement<'workspace'> = {
    name: 'test-colocation',
    scope: 'workspace',
    verify: ({ repoRoot, workspaceDir }) =>
        Promise.resolve(verifyTestColocation(listWorkspaceTestFiles(repoRoot, workspaceDir))),
};
