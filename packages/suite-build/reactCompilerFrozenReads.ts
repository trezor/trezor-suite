import { type Node, type NodePath, types as t, transformSync, traverse } from '@babel/core';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

import { REACT_COMPILER_PATHS, reactCompilerOptions } from './reactCompiler';

/**
 * Finds the React Compiler's one proven failure mode in this repository: a render-time read of a
 * `react-hook-form` accessor that the compiler caches on a dependency which never changes identity.
 *
 * `useForm()` returns a `useRef` payload, so `watch`, `getValues` and the `getDefaultValue` closure
 * over them keep one identity for a component's whole life. A render-body call on any of them
 * compiles to `if ($[0] !== watch) { t0 = watch("amount"); … }`, whose test is false from the second
 * render onwards — the value freezes permanently. Neither the compiler-backed ESLint rules nor
 * `@swc/jest` (which executes no babel plugin) can see it, so this is the only gate that can.
 *
 * ONCE THE READS BELOW SUBSCRIBE THROUGH `useWatch`, THIS MODULE AND ITS OPT-OUT DIRECTIVES GO AWAY.
 */

const repoRoot = path.resolve(__dirname, '../..');

/**
 * `react-hook-form`'s imperative accessors, plus this repo's own `getDefaultValue` wrapper
 * (`packages/suite/src/hooks/wallet/useSendFormFields.ts`). Deliberately a short hand-written list
 * rather than one derived from `UseFormReturn`: derivation is both too wide — `register`,
 * `handleSubmit` and `reset` are members too and are safe to cache — and too narrow, because it
 * cannot know about repo-local wrappers. `getFieldState` has no call site today and is forward cover.
 */
export const FORM_ACCESSORS: ReadonlySet<string> = new Set([
    'watch',
    'getValues',
    'getFieldState',
    'getDefaultValue',
]);

/**
 * Array methods that invoke their callback synchronously, so a read inside one still happens during
 * render. An allowlist rather than "any call at render level": the compiler emits `useEffect(t0, t1)`
 * at render level too, and treating that as render-evaluated reports every effect body.
 */
const SYNCHRONOUS_CALLBACK_METHODS: ReadonlySet<string> = new Set([
    'every',
    'filter',
    'find',
    'findIndex',
    'findLast',
    'findLastIndex',
    'flatMap',
    'forEach',
    'map',
    'reduce',
    'reduceRight',
    'some',
    'sort',
    'toSorted',
]);

/** Globals whose value differs per call, so caching one freezes the moment it was first read. */
const IMPURE_GLOBAL_READS: ReadonlyArray<{ object: string; property: string }> = [
    { object: 'Date', property: 'now' },
    { object: 'Math', property: 'random' },
    { object: 'crypto', property: 'randomUUID' },
    { object: 'performance', property: 'now' },
];

export type FrozenReadKind = 'render-read' | 'render-callback';

export type FrozenReadFinding = {
    file: string;
    line: number;
    column: number;
    accessor: string;
    kind: FrozenReadKind;
    /** Name of the compiled function the read sits in, for when a synthesised node carries a stale `loc`. */
    owner: string | null;
    /** How many dependencies have to change before the cached value is recomputed. */
    depCount: number;
};

export type ImpureCacheFinding = {
    file: string;
    line: number;
    column: number;
    global: string;
    owner: string | null;
};

export type SourceLocation = {
    file: string;
    line: number;
};

export type TransformError = {
    file: string;
    error: string;
};

export type FrozenReadReport = {
    /** Source files read. */
    files: number;
    /** Of those, the ones the compiler actually emitted a memo cache for. */
    compiled: number;
    /** Memo-cache guards examined, across every compiled file. */
    guards: number;
    findings: FrozenReadFinding[];
    /** Advisory only: impure globals cached behind a first-render sentinel. */
    impureCaches: ImpureCacheFinding[];
    /** Guards touching `$` in a shape this module does not model — a compiler-upgrade tripwire. */
    unknownGuardShapes: SourceLocation[];
    transformErrors: TransformError[];
};

export type CompileResult = { ast: t.File } | { error: string };

/**
 * Compiles one source file the way `base.webpack.config.ts` does, minus the plugins that cannot
 * affect memoization. `code: false` keeps the original `loc` on every node, so findings point at
 * source lines rather than at lines of a regenerated file nobody can open.
 */
export const compileForAnalysis = (source: string, filename: string): CompileResult => {
    try {
        const result = transformSync(source, {
            filename,
            ast: true,
            code: false,
            babelrc: false,
            configFile: false,
            sourceType: 'module',
            presets: [
                ['@babel/preset-react', { runtime: 'automatic' }],
                [
                    '@babel/preset-typescript',
                    { isTSX: filename.endsWith('x'), allExtensions: true },
                ],
            ],
            plugins: [['babel-plugin-react-compiler', reactCompilerOptions]],
        });

        if (result?.ast == null) {
            return { error: 'babel returned no AST' };
        }

        return { ast: result.ast };
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
};

/** `$[0]` — the memo cache slot the compiler compares against. */
const isCacheSlot = (node: t.Node): boolean =>
    t.isMemberExpression(node) &&
    node.computed &&
    t.isIdentifier(node.object) &&
    node.object.name === '$';

/** `Symbol.for('react.memo_cache_sentinel')` — the "never computed yet" marker. */
const isCacheSentinel = (node: t.Node): boolean =>
    t.isCallExpression(node) &&
    t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.object, { name: 'Symbol' }) &&
    t.isIdentifier(node.callee.property, { name: 'for' }) &&
    node.arguments.length === 1 &&
    t.isStringLiteral(node.arguments[0], { value: 'react.memo_cache_sentinel' });

type GuardShape =
    | { kind: 'dependency'; dependencies: t.Expression[] }
    | { kind: 'sentinel' }
    | { kind: 'unknown' }
    | { kind: 'unrelated' };

/** `$[0] !== a`, or a `||` disjunction of those; `null` for any other shape. */
const collectDependencies = (test: t.Node): t.Expression[] | null => {
    if (t.isLogicalExpression(test) && test.operator === '||') {
        const left = collectDependencies(test.left);
        const right = collectDependencies(test.right);

        return left !== null && right !== null ? [...left, ...right] : null;
    }

    if (t.isBinaryExpression(test) && test.operator === '!==' && isCacheSlot(test.left)) {
        return t.isExpression(test.right) ? [test.right] : null;
    }

    return null;
};

/**
 * Classifies an `if` test. Anything mentioning `$` that is neither a dependency comparison nor the
 * first-render sentinel is reported rather than skipped: a future compiler release emitting a new
 * guard shape would otherwise turn this gate into a silent pass.
 */
const classifyGuard = (test: t.Expression): GuardShape => {
    const dependencies = collectDependencies(test);
    if (dependencies !== null) {
        return { kind: 'dependency', dependencies };
    }

    if (
        t.isBinaryExpression(test) &&
        test.operator === '===' &&
        isCacheSlot(test.left) &&
        isCacheSentinel(test.right)
    ) {
        return { kind: 'sentinel' };
    }

    let touchesCache = false;
    t.traverseFast(test, node => {
        if (isCacheSlot(node)) {
            touchesCache = true;
        }
    });

    return touchesCache ? { kind: 'unknown' } : { kind: 'unrelated' };
};

/**
 * The name the accessor is *called by*: `getValues` for both `getValues(…)` and `form.getValues(…)`.
 * Matching on the root object instead would file every `form.getValues()` under `form` and miss it.
 */
const getAccessorName = (callee: t.Node): string | null => {
    if (t.isIdentifier(callee)) {
        return callee.name;
    }

    if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property)) {
        return callee.property.name;
    }

    return null;
};

/** A function the compiler emitted a memo cache for, i.e. one whose body opens with `const $ = _c(n)`. */
const isCompiledFunction = (node: t.Node): boolean => {
    if (!t.isFunction(node) || !t.isBlockStatement(node.body)) {
        return false;
    }

    return node.body.body.some(
        statement =>
            t.isVariableDeclaration(statement) &&
            statement.declarations.some(
                declarator =>
                    t.isCallExpression(declarator.init) &&
                    t.isIdentifier(declarator.init.callee, { name: '_c' }),
            ),
    );
};

const getFunctionName = (functionPath: NodePath<t.Function>): string | null => {
    const { node, parent } = functionPath;

    if ((t.isFunctionDeclaration(node) || t.isFunctionExpression(node)) && node.id !== null) {
        return node.id?.name ?? null;
    }

    if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
        return parent.id.name;
    }

    return null;
};

/** The outermost enclosing function that carries a memo cache, or `null` outside compiled code. */
const findCompiledOwner = (startPath: NodePath<Node>): NodePath<t.Function> | null => {
    let owner: NodePath<t.Function> | null = null;
    let current = startPath.getFunctionParent();

    while (current !== null) {
        if (isCompiledFunction(current.node)) {
            owner = current;
        }
        current = current.getFunctionParent();
    }

    return owner;
};

/**
 * Function bodies that still run during render even though they are not the component body: the
 * callback of a synchronous array method. The compiler outlines such a callback to its own temporary
 * (`t2 = name => …; t1 = names.map(t2)`), so the binding has to be followed rather than the parent.
 */
const collectRenderEvaluatedCallbacks = (ast: t.File): Set<t.Node> => {
    const callbacks = new Set<t.Node>();

    const resolveFunction = (valuePath: NodePath<Node>): t.Node | null => {
        const { node } = valuePath;
        if (t.isFunction(node)) {
            return node;
        }

        if (!t.isIdentifier(node)) {
            return null;
        }

        const binding = valuePath.scope.getBinding(node.name);
        if (binding === undefined) {
            return null;
        }

        if (t.isVariableDeclarator(binding.path.node) && t.isFunction(binding.path.node.init)) {
            return binding.path.node.init;
        }

        // `let t2; … t2 = name => …` — the shape the compiler emits inside a guard.
        const assigned = binding.constantViolations
            .map(violation => violation.node)
            .find(node_ => t.isAssignmentExpression(node_) && t.isFunction(node_.right));

        return t.isAssignmentExpression(assigned) && t.isFunction(assigned.right)
            ? assigned.right
            : null;
    };

    // A callback of a callback is render-evaluated too, so grow the set until it stops changing.
    let hasGrown = true;
    while (hasGrown) {
        hasGrown = false;

        traverse(ast, {
            CallExpression(callPath) {
                const { callee } = callPath.node;
                if (
                    !t.isMemberExpression(callee) ||
                    callee.computed ||
                    !t.isIdentifier(callee.property) ||
                    !SYNCHRONOUS_CALLBACK_METHODS.has(callee.property.name)
                ) {
                    return;
                }

                const enclosing = callPath.getFunctionParent();
                const isRenderEvaluated =
                    enclosing !== null &&
                    (isCompiledFunction(enclosing.node) || callbacks.has(enclosing.node));
                if (!isRenderEvaluated) {
                    return;
                }

                callPath.get('arguments').forEach(argumentPath => {
                    const callback = resolveFunction(argumentPath);
                    if (callback !== null && !callbacks.has(callback)) {
                        callbacks.add(callback);
                        hasGrown = true;
                    }
                });
            },
        });
    }

    return callbacks;
};

type AnalyseCompiledModuleResult = {
    guards: number;
    findings: FrozenReadFinding[];
    impureCaches: ImpureCacheFinding[];
    unknownGuardShapes: SourceLocation[];
};

type GetReadKindParams = {
    enclosing: NodePath<t.Function>;
    owner: NodePath<t.Function> | null;
    renderEvaluatedCallbacks: Set<t.Node>;
};

/** `null` for a genuine closure — a handler or effect body reads the form when it runs, not at render. */
const getReadKind = ({
    enclosing,
    owner,
    renderEvaluatedCallbacks,
}: GetReadKindParams): FrozenReadKind | null => {
    if (owner !== null && enclosing.node === owner.node) {
        return 'render-read';
    }

    return renderEvaluatedCallbacks.has(enclosing.node) ? 'render-callback' : null;
};

type CollectImpureCachesParams = {
    guardPath: NodePath<t.IfStatement>;
    file: string;
    ownerName: string | null;
    owner: NodePath<t.Function> | null;
    impureCaches: ImpureCacheFinding[];
};

const collectImpureCaches = ({
    guardPath,
    file,
    ownerName,
    owner,
    impureCaches,
}: CollectImpureCachesParams) => {
    guardPath.get('consequent').traverse({
        MemberExpression(memberPath) {
            const { node } = memberPath;
            if (node.computed || !t.isIdentifier(node.object) || !t.isIdentifier(node.property)) {
                return;
            }

            const isImpure = IMPURE_GLOBAL_READS.some(
                ({ object, property }) =>
                    t.isIdentifier(node.object, { name: object }) &&
                    t.isIdentifier(node.property, { name: property }),
            );
            if (!isImpure) {
                return;
            }

            // Inside a closure the value is read when the closure runs, so caching it is harmless.
            if (owner === null || memberPath.getFunctionParent()?.node !== owner.node) {
                return;
            }

            const { line = 0, column = 0 } = node.loc?.start ?? {};
            impureCaches.push({
                file,
                line,
                column,
                global: `${node.object.name}.${node.property.name}`,
                owner: ownerName,
            });
        },

        NewExpression(newPath) {
            const { node } = newPath;
            if (!t.isIdentifier(node.callee, { name: 'Date' }) || node.arguments.length > 0) {
                return;
            }

            if (owner === null || newPath.getFunctionParent()?.node !== owner.node) {
                return;
            }

            const { line = 0, column = 0 } = node.loc?.start ?? {};
            impureCaches.push({ file, line, column, global: 'new Date()', owner: ownerName });
        },
    });
};

/**
 * Walks one already-compiled module. Takes the AST rather than source so a hand-written guard shape
 * can be fed straight in, which is the only way to test the compiler-upgrade tripwire.
 */
export const analyseCompiledModule = (ast: t.File, file: string): AnalyseCompiledModuleResult => {
    const renderEvaluatedCallbacks = collectRenderEvaluatedCallbacks(ast);
    const findings: FrozenReadFinding[] = [];
    const impureCaches: ImpureCacheFinding[] = [];
    const unknownGuardShapes: SourceLocation[] = [];
    const seen = new Set<string>();
    let guards = 0;

    traverse(ast, {
        IfStatement(guardPath) {
            const guard = classifyGuard(guardPath.node.test);
            if (guard.kind === 'unrelated') {
                return;
            }

            if (guard.kind === 'unknown') {
                unknownGuardShapes.push({
                    file,
                    line: guardPath.node.loc?.start.line ?? 0,
                });

                return;
            }

            guards += 1;
            const owner = findCompiledOwner(guardPath);
            const ownerName = owner === null ? null : getFunctionName(owner);

            if (guard.kind === 'sentinel') {
                collectImpureCaches({ guardPath, file, ownerName, owner, impureCaches });

                return;
            }

            guardPath.get('consequent').traverse({
                CallExpression(callPath) {
                    const accessor = getAccessorName(callPath.node.callee);
                    if (accessor === null || !FORM_ACCESSORS.has(accessor)) {
                        return;
                    }

                    const enclosing = callPath.getFunctionParent();
                    if (enclosing === null) {
                        return;
                    }

                    const kind = getReadKind({ enclosing, owner, renderEvaluatedCallbacks });
                    if (kind === null) {
                        return;
                    }

                    const { line = 0, column = 0 } = callPath.node.loc?.start ?? {};
                    const key = `${file}:${line}:${column}:${accessor}`;
                    if (seen.has(key)) {
                        return;
                    }
                    seen.add(key);

                    findings.push({
                        file,
                        line,
                        column,
                        accessor,
                        kind,
                        owner: ownerName,
                        depCount: guard.dependencies.length,
                    });
                },
            });
        },
    });

    return { guards, findings, impureCaches, unknownGuardShapes };
};

const SOURCE_EXTENSIONS = /\.(j|t)sx?$/;
const NON_SOURCE_FILE = /(\.d\.ts|\.(test|spec)\.(j|t)sx?)$/;
const SKIPPED_DIRECTORIES: ReadonlySet<string> = new Set([
    '__snapshots__',
    'libDev',
    'node_modules',
]);

const listSourceFiles = (directory: string): string[] => {
    let entries;
    try {
        entries = readdirSync(directory, { withFileTypes: true });
    } catch {
        return [];
    }

    return entries.flatMap(entry => {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            return SKIPPED_DIRECTORIES.has(entry.name) ? [] : listSourceFiles(entryPath);
        }

        const isSource = SOURCE_EXTENSIONS.test(entry.name) && !NON_SOURCE_FILE.test(entry.name);

        return isSource ? [entryPath] : [];
    });
};

/**
 * Compiles and analyses every source file under the given repo-root-relative directories. Tests are
 * skipped on purpose: production never compiles them, so a read in one cannot freeze anything.
 */
export const scanDirectories = (
    directories: readonly string[] = REACT_COMPILER_PATHS,
    root: string = repoRoot,
): FrozenReadReport => {
    const report: FrozenReadReport = {
        files: 0,
        compiled: 0,
        guards: 0,
        findings: [],
        impureCaches: [],
        unknownGuardShapes: [],
        transformErrors: [],
    };

    directories.forEach(directory => {
        listSourceFiles(path.join(root, directory)).forEach(filename => {
            const file = path.relative(root, filename).split(path.sep).join('/');
            report.files += 1;

            const compiled = compileForAnalysis(readFileSync(filename, 'utf-8'), filename);
            if ('error' in compiled) {
                report.transformErrors.push({ file, error: compiled.error });

                return;
            }

            const analysis = analyseCompiledModule(compiled.ast, file);

            if (analysis.guards > 0) {
                report.compiled += 1;
                report.guards += analysis.guards;
            }

            report.findings.push(...analysis.findings);
            report.impureCaches.push(...analysis.impureCaches);
            report.unknownGuardShapes.push(...analysis.unknownGuardShapes);
        });
    });

    return report;
};

const describeFinding = ({
    file,
    line,
    column,
    accessor,
    kind,
    owner,
    depCount,
}: FrozenReadFinding) =>
    `${file}:${line}:${column}  ${accessor}  ${kind}  in ${owner ?? '<anonymous>'}, ` +
    `recomputed only when ${depCount === 1 ? 'its single dependency changes' : `one of ${depCount} dependencies changes`}`;

/**
 * Turns a report into the reasons the gate should fail, so the decision is testable without running
 * a scan. An empty array means the enabled waves are clean.
 */
export const evaluateFrozenReadReport = (
    report: FrozenReadReport,
    directories: readonly string[] = REACT_COMPILER_PATHS,
): string[] => {
    const failures: string[] = [];

    // The same failure mode `assertReactCompilerPathsAreValid` guards against, one layer down: a
    // scan that quietly stops compiling reports zero findings forever.
    if (directories.length > 0 && report.compiled === 0) {
        failures.push(
            `Scanned ${report.files} file(s) under ${directories.join(', ')} and the React Compiler ` +
                `produced no memo cache in any of them. Either the wave list is wrong or this ` +
                `analysis has stopped compiling — it is not evidence that the wave is clean.`,
        );
    }

    report.transformErrors.forEach(({ file, error }) =>
        failures.push(
            `${file} could not be compiled, so it was not checked: ${error}. A file the analysis ` +
                `cannot read is a blind spot inside a compiled tree.`,
        ),
    );

    report.unknownGuardShapes.forEach(({ file, line }) =>
        failures.push(
            `${file}:${line} holds a memo-cache guard in a shape this analysis does not model. ` +
                `babel-plugin-react-compiler has most likely changed how it emits guards; teach ` +
                `\`classifyGuard\` the new shape before trusting a green run.`,
        ),
    );

    report.findings.forEach(finding =>
        failures.push(
            `${describeFinding(finding)} — a react-hook-form accessor read during render in a ` +
                `compiled path. Subscribe with \`useWatch\`, move the read into an event handler or ` +
                `effect, or opt the function out with \`'use no memo'\`.`,
        ),
    );

    return failures;
};
