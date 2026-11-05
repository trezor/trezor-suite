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

// A call statement next to the tests may be a helper from another module declaring further tests,
// and their names cannot be read from this file.
const isUnknownCallStatement = (statement: babelTypes.Statement) => {
    if (!babelTypes.isExpressionStatement(statement)) return false;
    if (!babelTypes.isCallExpression(statement.expression)) return false;

    const { callee } = statement.expression;

    if (getTestBlockKind(callee)) return false;
    if (babelTypes.isIdentifier(callee) && HOOK_FUNCTION_NAMES.includes(callee.name)) return false;

    const isJestCall =
        babelTypes.isMemberExpression(callee) &&
        babelTypes.isIdentifier(callee.object, { name: 'jest' });

    return !isJestCall;
};

const getDescribeBodyStatements = (describeCallback: babelTypes.Node | undefined) => {
    const isFunction =
        babelTypes.isArrowFunctionExpression(describeCallback) ||
        babelTypes.isFunctionExpression(describeCallback);

    if (!isFunction || !babelTypes.isBlockStatement(describeCallback.body)) return [];

    return describeCallback.body.body;
};

const walk = ({ node, parent, ancestorTitles, scan }: WalkParams): void => {
    if (babelTypes.isCallExpression(node)) {
        const testBlockKind = getTestBlockKind(node.callee);

        if (testBlockKind) {
            const [titleArgument, ...restArguments] = node.arguments;
            const title = getStaticTitle(titleArgument);

            if (title === undefined) {
                scan.areAllTestNamesKnown = false;

                return;
            }

            if (testBlockKind === 'test') {
                // Jest matches the test name pattern against the titles joined by a space.
                scan.testNames.push([...ancestorTitles, title].join(' '));

                return;
            }

            if (getDescribeBodyStatements(restArguments[0]).some(isUnknownCallStatement)) {
                scan.areAllTestNamesKnown = false;
            }

            restArguments.forEach(argument =>
                walk({
                    node: argument,
                    parent: node,
                    ancestorTitles: [...ancestorTitles, title],
                    scan,
                }),
            );

            return;
        }
    }

    // A test function used in any other way (`it.each`, an alias, a wrapper) declares tests whose
    // names cannot be read statically.
    if (isTestFunctionReference(node, parent)) {
        scan.areAllTestNamesKnown = false;
    }

    const childKeys = babelTypes.VISITOR_KEYS[node.type] ?? [];

    childKeys.forEach(key => {
        const child: unknown = node[key as keyof typeof node];
        const children = Array.isArray(child) ? child : [child];

        children.forEach(childNode => {
            if (babelTypes.isNode(childNode)) {
                walk({ node: childNode, parent: node, ancestorTitles, scan });
            }
        });
    });
};

const scanTestNames = (source: string): TestNamesScan => {
    const scan: TestNamesScan = { testNames: [], areAllTestNamesKnown: true };
    const ast = parseSync(source, {
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ['typescript'] },
    });

    if (!ast) return { testNames: [], areAllTestNamesKnown: false };

    if (ast.program.body.some(isUnknownCallStatement)) {
        scan.areAllTestNamesKnown = false;
    }

    walk({ node: ast.program, ancestorTitles: [], scan });

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

/**
 * Leaves out the test files in which Jest would skip every test because no test name matches the
 * grep of a project. Starting such a file still costs the app installation and the file load.
 */
export const getTestFilesMatchingGrep = ({ testFiles, grep }: GetTestFilesMatchingGrepParams) => {
    if (!grep) return testFiles;

    // Jest matches `testNamePattern` case-insensitively.
    const grepRegex = new RegExp(grep, 'i');

    return testFiles.filter(testFile =>
        canTestSourceMatchGrep({ source: fs.readFileSync(testFile, 'utf8'), grepRegex }),
    );
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
