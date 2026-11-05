import { types as babelTypes, parseSync } from '@babel/core';
import * as fs from 'fs';

import type { ProjectConfig } from '../trezorDetoxRunner/types';

const DESCRIBE_FUNCTION_NAMES = ['describe', 'fdescribe', 'xdescribe'];
const TEST_FUNCTION_NAMES = ['it', 'fit', 'xit', 'test', 'xtest'];
const HOOK_FUNCTION_NAMES = ['beforeAll', 'beforeEach', 'afterAll', 'afterEach'];

type TestBlockKind = 'describe' | 'test';

type TestNamesScan = {
    testNames: string[];
    areAllTestNamesKnown: boolean;
};

type WalkParams = {
    node: babelTypes.Node;
    parent?: babelTypes.Node;
    ancestorTitles: string[];
    // The module body and describe callbacks run while Jest collects the tests. Any other function
    // runs only when it is called, so the describe blocks of the tests it declares are unknown.
    isCollectingTests: boolean;
    scan: TestNamesScan;
};

export type ProjectTestFiles = {
    project: ProjectConfig;
    testFiles: string[];
};

type CanTestSourceMatchGrepParams = {
    source: string;
    grepRegex: RegExp;
};

type GetTestFilesMatchingGrepParams = {
    testFiles: string[];
    grep?: string;
};

type ShardProjectTestFilesParams = {
    projectTestFiles: ProjectTestFiles[];
    shard: number;
    totalShards: number;
};

const getTestBlockKind = (
    callee: babelTypes.CallExpression['callee'],
): TestBlockKind | undefined => {
    // Modifiers such as `describe.skip` or `it.only` keep the kind of the function they modify.
    const testFunction = babelTypes.isMemberExpression(callee) ? callee.object : callee;

    if (!babelTypes.isIdentifier(testFunction)) return undefined;
    if (DESCRIBE_FUNCTION_NAMES.includes(testFunction.name)) return 'describe';
    if (TEST_FUNCTION_NAMES.includes(testFunction.name)) return 'test';

    return undefined;
};

const getStaticTitle = (title: babelTypes.Node | undefined): string | undefined => {
    if (babelTypes.isStringLiteral(title)) return title.value;

    if (babelTypes.isTemplateLiteral(title) && title.expressions.length === 0) {
        return title.quasis[0]?.value.cooked ?? undefined;
    }

    return undefined;
};

const isTestFunctionReference = (node: babelTypes.Node, parent?: babelTypes.Node) =>
    babelTypes.isIdentifier(node) &&
    [...DESCRIBE_FUNCTION_NAMES, ...TEST_FUNCTION_NAMES].includes(node.name) &&
    (!parent || babelTypes.isReferenced(node, parent));

const isJestFunctionCallee = (callee: babelTypes.CallExpression['callee']) => {
    if (getTestBlockKind(callee)) return true;
    if (babelTypes.isIdentifier(callee) && HOOK_FUNCTION_NAMES.includes(callee.name)) return true;

    return (
        babelTypes.isMemberExpression(callee) &&
        babelTypes.isIdentifier(callee.object, { name: 'jest' })
    );
};

const getChildNodes = (node: babelTypes.Node): babelTypes.Node[] =>
    (babelTypes.VISITOR_KEYS[node.type] ?? []).flatMap(key => {
        const child: unknown = node[key as keyof typeof node];

        return (Array.isArray(child) ? child : [child]).filter(babelTypes.isNode);
    });

// A call next to the tests, even a nested or awaited one, may be a helper from another module
// declaring further tests, and their names cannot be read from this file. Calls in the functions
// the expression defines only run later.
const hasUnknownCall = (node: babelTypes.Node): boolean => {
    if (babelTypes.isFunction(node)) return false;
    if (babelTypes.isTaggedTemplateExpression(node)) return true;

    const isCall =
        babelTypes.isCallExpression(node) ||
        babelTypes.isOptionalCallExpression(node) ||
        babelTypes.isNewExpression(node);

    if (isCall && !isJestFunctionCallee(node.callee)) return true;

    return getChildNodes(node).some(hasUnknownCall);
};

const walk = ({ node, parent, ancestorTitles, isCollectingTests, scan }: WalkParams): void => {
    if (babelTypes.isCallExpression(node)) {
        const testBlockKind = getTestBlockKind(node.callee);

        if (testBlockKind) {
            const [titleArgument, describeCallback] = node.arguments;
            const title = getStaticTitle(titleArgument);

            if (!isCollectingTests || title === undefined) {
                scan.areAllTestNamesKnown = false;

                return;
            }

            if (testBlockKind === 'test') {
                // Jest matches the test name pattern against the titles joined by a space.
                scan.testNames.push([...ancestorTitles, title].join(' '));

                return;
            }

            // A callback defined elsewhere may also declare its tests outside of this describe block.
            if (
                !babelTypes.isArrowFunctionExpression(describeCallback) &&
                !babelTypes.isFunctionExpression(describeCallback)
            ) {
                scan.areAllTestNamesKnown = false;

                return;
            }

            const { body } = describeCallback;

            if (!babelTypes.isBlockStatement(body) && hasUnknownCall(body)) {
                scan.areAllTestNamesKnown = false;
            }

            walk({
                node: body,
                parent: describeCallback,
                ancestorTitles: [...ancestorTitles, title],
                isCollectingTests: true,
                scan,
            });

            return;
        }
    }

    // A test function used in any other way (`it.each`, an alias, a wrapper) declares tests whose
    // names cannot be read statically.
    if (isTestFunctionReference(node, parent)) {
        scan.areAllTestNamesKnown = false;
    }

    if (
        isCollectingTests &&
        babelTypes.isExpressionStatement(node) &&
        hasUnknownCall(node.expression)
    ) {
        scan.areAllTestNamesKnown = false;
    }

    // A module imported only for its side effects may declare shared tests when it loads.
    if (babelTypes.isImportDeclaration(node) && node.specifiers.length === 0) {
        scan.areAllTestNamesKnown = false;
    }

    getChildNodes(node).forEach(childNode =>
        walk({
            node: childNode,
            parent: node,
            ancestorTitles,
            isCollectingTests: isCollectingTests && !babelTypes.isFunction(node),
            scan,
        }),
    );
};

const scanTestNames = (source: string): TestNamesScan => {
    const scan: TestNamesScan = { testNames: [], areAllTestNamesKnown: true };
    const ast = parseSync(source, {
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ['typescript'] },
    });

    if (!ast) return { testNames: [], areAllTestNamesKnown: false };

    walk({ node: ast.program, ancestorTitles: [], isCollectingTests: true, scan });

    return scan;
};

/**
 * Tells whether a test file may contain a test whose name matches the grep, without running it.
 * Whenever a test name cannot be determined statically, the file is kept, so a test is never left
 * out by mistake; the file is then only started to skip its tests, like without this check.
 */
export const canTestSourceMatchGrep = ({ source, grepRegex }: CanTestSourceMatchGrepParams) => {
    let scan: TestNamesScan;

    try {
        scan = scanTestNames(source);
    } catch {
        return true;
    }

    if (!scan.areAllTestNamesKnown || scan.testNames.length === 0) return true;

    return scan.testNames.some(testName => grepRegex.test(testName));
};

const readTestSource = (testFile: string) => {
    try {
        return fs.readFileSync(testFile, 'utf8');
    } catch {
        return undefined;
    }
};

/**
 * Leaves out the test files in which Jest would skip every test because no test name matches the
 * grep of a project. Starting such a file still costs the app installation and the file load.
 */
export const getTestFilesMatchingGrep = ({ testFiles, grep }: GetTestFilesMatchingGrepParams) => {
    if (!grep) return testFiles;

    // Jest matches `testNamePattern` case-insensitively.
    const grepRegex = new RegExp(grep, 'i');

    return testFiles.filter(testFile => {
        const source = readTestSource(testFile);

        // Jest reads the test files given on the command line as path patterns, so a directory or
        // a part of a file name is passed on for Jest to resolve.
        return source === undefined || canTestSourceMatchGrep({ source, grepRegex });
    });
};

/**
 * Splits the test files of all projects among the shards by project and file, so that every shard
 * gets a similar number of files to test and a project without files in a shard is not started.
 */
export const shardProjectTestFiles = ({
    projectTestFiles,
    shard,
    totalShards,
}: ShardProjectTestFilesParams): ProjectTestFiles[] => {
    const shardTestRuns = projectTestFiles
        .flatMap(({ project, testFiles }) => testFiles.map(testFile => ({ project, testFile })))
        .filter((_, index) => index % totalShards === shard);

    return projectTestFiles
        .map(({ project }) => ({
            project,
            testFiles: shardTestRuns
                .filter(testRun => testRun.project === project)
                .map(testRun => testRun.testFile),
        }))
        .filter(({ testFiles }) => testFiles.length > 0);
};
