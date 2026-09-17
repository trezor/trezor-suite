import { type Node, type NodePath, types as t, transformSync, traverse } from '@babel/core';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

import { REACT_COMPILER_PATHS, reactCompilerOptions } from './reactCompiler';

/**
 * Finds the two failure modes the React Compiler has actually shipped in this repository. Neither the
 * compiler-backed ESLint rules nor `@swc/jest` (which executes no babel plugin) can see either one,
 * so this is the only gate that can.
 *
 * 1. `findings` — a render-time read of a `react-hook-form` accessor that the compiler caches on a
 *    dependency which never changes identity. `useForm()` returns a `useRef` payload, so `watch`,
 *    `getValues` and the `getDefaultValue` closure over them keep one identity for a component's
 *    whole life. A render-body call on any of them compiles to
 *    `if ($[0] !== watch) { t0 = watch("amount"); … }`, whose test is false from the second render
 *    onwards — the value freezes permanently.
 *
 * 2. `frozenCaptures` — an impure render-scoped value captured by a closure the compiler caches. The
 *    exact complement of `impureCaches`: there the impure read itself is cached, here it is
 *    recomputed every render and the closure reading it is not, so the closure keeps serving the
 *    first render's value. Structurally invisible to `impureCaches`, which only ever walks a guard
 *    consequent — the impure read sits at render level, between two guards, inside no guard at all.
 *    `ConnectionGlobalModalContext.tsx` shipped one: a Bluetooth liveness cut-off frozen at mount.
 *
 * ONCE THE READS BELOW SUBSCRIBE THROUGH `useWatch`, THE FIRST HALF OF THIS MODULE AND ITS OPT-OUT
 * DIRECTIVES GO AWAY. The second half outlives it — it guards a compiler behaviour, not a library.
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

export type FrozenCaptureFinding = {
    file: string;
    /** Line of the cached closure — the thing to change. */
    line: number;
    column: number;
    /** What makes the captured value differ per render: `Date.now()`, `Math.random()`, `new Date()`. */
    global: string;
    /** The render-scoped binding the closure captures. */
    binding: string;
    /** Where the impure value is read. A synthesised declarator loses its `loc`; the read keeps one. */
    readLine: number;
    owner: string | null;
    /** `0` for a first-render sentinel: the closure is built once, ever. */
    depCount: number;
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
    /** Impure render-scoped values captured by a cached closure, so the closure serves a stale one. */
    frozenCaptures: FrozenCaptureFinding[];
    /** Advisory only: files the compiler skips only because of an ESLint suppression. */
    suppressedFiles: SuppressedFile[];
    /** Every file in a compiled tree that is not fully compiled, deliberately or not. */
    optOuts: CompilerOptOut[];
    /** Guards touching `$` in a shape this module does not model — a compiler-upgrade tripwire. */
    unknownGuardShapes: SourceLocation[];
    transformErrors: TransformError[];
};

/**
 * A file inside a compiled tree that the compiler does not fully optimise.
 *
 * - `opt-out` / `opt-out-partial` — deliberate `'use no memo'`, whole file or one function.
 * - `bail` / `partial` — the compiler refused, whole file or one function. Nobody chose this and
 *   nothing else reports it.
 */
export type CompilerOptOut = {
    file: string;
    status: 'bail' | 'partial' | 'opt-out' | 'opt-out-partial';
    /** Why the compiler refused, deduplicated; `'use no memo'` for a deliberate opt-out. */
    reasons: string[];
};

export type SuppressedFile = {
    file: string;
    /** Memo caches the compiler emits today. */
    caches: number;
    /** What it would emit with the suppressions removed. */
    cachesWithoutSuppressions: number;
};

/**
 * One `babel-plugin-react-compiler` log event, flattened to what the snapshot needs. `kind` is the
 * compiler's own (`CompileSuccess`, `CompileError`, `CompileSkip`, `CompileDiagnostic`, …).
 */
export type CompilerEvent = {
    kind: string;
    reason: string | null;
};

export type CompileResult = { ast: t.File; events: CompilerEvent[] } | { error: string };

/** The compiler reports a refusal through several detail shapes; this is the one line worth keeping. */
const describeEventDetail = (detail: unknown): string | null => {
    if (detail === null || typeof detail !== 'object') {
        return typeof detail === 'string' ? detail : null;
    }

    const { reason, description, message } = detail as Record<string, unknown>;

    return (
        [reason, description, message].find(
            (candidate): candidate is string => typeof candidate === 'string',
        ) ?? null
    );
};

/**
 * Compiles one source file the way `base.webpack.config.ts` does, minus the plugins that cannot
 * affect memoization. `code: false` keeps the original `loc` on every node, so findings point at
 * source lines rather than at lines of a regenerated file nobody can open.
 *
 * The `logger` is analysis-only and must never reach `reactCompilerOptions`: the webpack and Vite
 * builds share that object, and they have no use for an event stream nobody reads.
 */
export const compileForAnalysis = (source: string, filename: string): CompileResult => {
    const events: CompilerEvent[] = [];
    const logger = {
        logEvent: (_filename: string | null, event: { kind: string; detail?: unknown }) => {
            // `Timing` and the `AutoDeps*` pair fire constantly and say nothing about refusals.
            if (
                event.kind === 'CompileSuccess' ||
                event.kind.startsWith('AutoDeps') ||
                event.kind === 'Timing'
            ) {
                return;
            }

            events.push({ kind: event.kind, reason: describeEventDetail(event.detail) });
        },
    };

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
            plugins: [['babel-plugin-react-compiler', { ...reactCompilerOptions, logger }]],
        });

        if (result?.ast == null) {
            return { error: 'babel returned no AST' };
        }

        return { ast: result.ast, events };
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
    frozenCaptures: FrozenCaptureFinding[];
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

/** A guard that caches its consequent behind the memo array, of either shape. */
const isMemoGuard = (candidate: NodePath<Node>): boolean => {
    if (!candidate.isIfStatement()) {
        return false;
    }

    const { kind } = classifyGuard(candidate.node.test);

    return kind === 'dependency' || kind === 'sentinel';
};

/**
 * The nearest enclosing memo-cache guard, searching no further up than `owner` — so a guard belonging
 * to an outer component can never be mistaken for one of this owner's.
 */
const findEnclosingMemoGuard = (
    startPath: NodePath<Node>,
    owner: NodePath<t.Function>,
): NodePath<Node> | null => {
    const found = startPath.findParent(
        candidate => candidate.node === owner.node || isMemoGuard(candidate),
    );

    return found === null || found.node === owner.node ? null : found;
};

type ImpureRead = { global: string; line: number };

type ImpureRenderBinding = ImpureRead & {
    name: string;
    references: NodePath<Node>[];
};

/**
 * The impure global an expression reads, ignoring nested functions: a closure's own read happens when
 * the closure runs, so it says nothing about the value of the binding being initialised.
 */
const findImpureRead = (valuePath: NodePath<Node>): ImpureRead | null => {
    const found: { read: ImpureRead | null } = { read: null };

    const inspect = (candidatePath: NodePath<Node>) => {
        if (found.read !== null) {
            return;
        }

        const { node } = candidatePath;
        const line = node.loc?.start.line ?? 0;

        if (
            t.isMemberExpression(node) &&
            !node.computed &&
            t.isIdentifier(node.object) &&
            t.isIdentifier(node.property) &&
            IMPURE_GLOBAL_READS.some(
                ({ object, property }) =>
                    node.object.type === 'Identifier' &&
                    node.object.name === object &&
                    node.property.type === 'Identifier' &&
                    node.property.name === property,
            )
        ) {
            found.read = { global: `${node.object.name}.${node.property.name}()`, line };

            return;
        }

        if (
            t.isNewExpression(node) &&
            t.isIdentifier(node.callee, { name: 'Date' }) &&
            node.arguments.length === 0
        ) {
            found.read = { global: 'new Date()', line };
        }
    };

    inspect(valuePath);
    valuePath.traverse({
        Function(nestedPath) {
            nestedPath.skip();
        },
        MemberExpression: inspect,
        NewExpression: inspect,
    });

    return found.read;
};

/**
 * Bindings the compiler leaves at render level whose value differs every render. Deliberately *not*
 * the ones declared inside a guard: those are already `impureCaches`' territory, and reporting both
 * would file one site twice.
 */
const collectImpureRenderBindings = (owner: NodePath<t.Function>): ImpureRenderBinding[] => {
    const candidates: NodePath<t.VariableDeclarator>[] = [];

    owner.get('body').traverse({
        Function(nestedPath) {
            nestedPath.skip();
        },
        VariableDeclarator(declaratorPath) {
            if (!t.isIdentifier(declaratorPath.node.id) || declaratorPath.node.init == null) {
                return;
            }

            if (findEnclosingMemoGuard(declaratorPath, owner) === null) {
                candidates.push(declaratorPath);
            }
        },
    });

    const bindings: ImpureRenderBinding[] = [];

    // `const now = Date.now(); const boundary = now - LIMIT;` — impurity spreads through render-level
    // bindings, so keep passing over them until it stops spreading.
    let hasGrown = true;
    while (hasGrown) {
        hasGrown = false;

        candidates.forEach(declaratorPath => {
            const { name } = declaratorPath.node.id as t.Identifier;
            if (bindings.some(known => known.name === name)) {
                return;
            }

            const binding = declaratorPath.scope.getBinding(name);
            // Reassigned later, which drops the compiler's own `let tN; if (…) { tN = Date.now(); }`
            // temporaries — those are cached, not render-level, and `impureCaches` already has them.
            if (binding === undefined || !binding.constant) {
                return;
            }

            const initializerPath = declaratorPath.get('init') as NodePath<Node>;
            const read =
                findImpureRead(initializerPath) ??
                bindings.find(known =>
                    known.references.some(reference => reference.isDescendant(initializerPath)),
                ) ??
                null;

            if (read === null) {
                return;
            }

            bindings.push({
                name,
                global: read.global,
                line: read.line,
                references: binding.referencePaths,
            });
            hasGrown = true;
        });
    }

    return bindings;
};

type CollectFrozenCapturesParams = {
    guardPath: NodePath<t.IfStatement>;
    guard: GuardShape;
    file: string;
    ownerName: string | null;
    owner: NodePath<t.Function> | null;
    /** Per-owner cache: the guard visitor fires thousands of times and step one walks a whole body. */
    impureRenderBindings: Map<t.Node, ImpureRenderBinding[]>;
    frozenCaptures: FrozenCaptureFinding[];
};

/**
 * The complement of `collectImpureCaches`: a closure this guard caches, which reads an impure value
 * computed *outside* the guard. The guard keeps handing back the closure built on the render that
 * first filled the slot, so the closure keeps serving that render's value however often it is called.
 */
const collectFrozenCaptures = ({
    guardPath,
    guard,
    file,
    ownerName,
    owner,
    impureRenderBindings,
    frozenCaptures,
}: CollectFrozenCapturesParams) => {
    if (owner === null) {
        return;
    }

    let bindings = impureRenderBindings.get(owner.node);
    if (bindings === undefined) {
        bindings = collectImpureRenderBindings(owner);
        impureRenderBindings.set(owner.node, bindings);
    }

    if (bindings.length === 0) {
        return;
    }

    // A guard that already depends on the impure value is rebuilt whenever that value changes.
    const dependencyNames = new Set<string>();
    if (guard.kind === 'dependency') {
        guard.dependencies.forEach(dependency => {
            if (t.isIdentifier(dependency)) {
                dependencyNames.add(dependency.name);
            }
        });
    }

    const stale = bindings.filter(binding => !dependencyNames.has(binding.name));
    if (stale.length === 0) {
        return;
    }

    const depCount = guard.kind === 'dependency' ? guard.dependencies.length : 0;

    guardPath.get('consequent').traverse({
        Function(functionPath) {
            // Report the outermost cached closure only: a closure nested inside it is frozen by the
            // same guard for the same reason, and one finding per site is enough to act on.
            functionPath.skip();

            if (functionPath.getFunctionParent()?.node !== owner.node) {
                return;
            }

            // The guard caching this closure has to be this one rather than a guard nested inside it,
            // or the compiler's `if (deps) { if (sentinel) { t = … } }` shape reports twice.
            if (findEnclosingMemoGuard(functionPath, owner)?.node !== guardPath.node) {
                return;
            }

            stale.forEach(({ name, global, line: readLine, references }) => {
                // `referencePaths` only holds references that resolve to this binding, so a shadowed
                // name inside the closure is not a capture and needs no special case here.
                if (!references.some(reference => reference.isDescendant(functionPath))) {
                    return;
                }

                const { line = 0, column = 0 } = functionPath.node.loc?.start ?? {};
                frozenCaptures.push({
                    file,
                    line,
                    column,
                    global,
                    binding: name,
                    readLine,
                    owner: ownerName,
                    depCount,
                });
            });
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
    const frozenCaptures: FrozenCaptureFinding[] = [];
    const impureRenderBindings = new Map<t.Node, ImpureRenderBinding[]>();
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

            collectFrozenCaptures({
                guardPath,
                guard,
                file,
                ownerName,
                owner,
                impureRenderBindings,
                frozenCaptures,
            });

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

    return { guards, findings, impureCaches, frozenCaptures, unknownGuardShapes };
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
 * `react-hooks/exhaustive-deps` and `react-hooks/rules-of-hooks` are the compiler's
 * `DEFAULT_ESLINT_SUPPRESSIONS`, so suppressing either drops the enclosing function — or, at file
 * scope, the whole file — from compilation. Nothing reports it, which makes a suppression added for
 * an unrelated reason an invisible opt-out, and its later removal an invisible opt-in.
 */
const ESLINT_SUPPRESSION =
    /eslint-disable(-next-line)?\s[^\n]*react-hooks\/(exhaustive-deps|rules-of-hooks)/;

const countMemoCaches = (ast: t.File): number => {
    let caches = 0;

    traverse(ast, {
        CallExpression(callPath) {
            if (t.isIdentifier(callPath.node.callee, { name: '_c' })) {
                caches += 1;
            }
        },
    });

    return caches;
};

/**
 * `null` unless removing the file's suppressions would make the compiler emit more memo caches —
 * that is, unless a lint suppression is the only thing keeping this file out of the compiled set.
 * A deliberate `'use no memo'` is not reported: that opt-out is already visible to the next reader.
 */
export const findSuppressedFile = (
    source: string,
    filename: string,
    file: string,
    ast: t.File,
): SuppressedFile | null => {
    // A deliberate `'use no memo'` is not reported — that opt-out is already visible.
    if (!ESLINT_SUPPRESSION.test(source) || /^\s*'use no memo'/m.test(source)) return null;

    const withoutSuppressions = compileForAnalysis(
        source
            .split('\n')
            .filter(line => !ESLINT_SUPPRESSION.test(line))
            .join('\n'),
        filename,
    );
    if ('error' in withoutSuppressions) return null;

    const caches = countMemoCaches(ast);
    const cachesWithoutSuppressions = countMemoCaches(withoutSuppressions.ast);

    return cachesWithoutSuppressions > caches ? { file, caches, cachesWithoutSuppressions } : null;
};

const USE_NO_MEMO = /^\s*['"]use no memo['"]/m;

/**
 * Classifies one already-compiled file against the snapshot's four statuses, or `null` when the file
 * is fully compiled — or was never a candidate, which is most of `suite-common`: a module of types,
 * selectors or reducers holds nothing `compilationMode: 'infer'` would compile, and the compiler
 * says nothing about it at all.
 *
 * The distinction that matters is `caches > 0`: it separates a whole file the compiler dropped from
 * one where it dropped a single function.
 */
export const classifyCompilerOptOut = (
    source: string,
    file: string,
    ast: t.File,
    events: readonly CompilerEvent[],
): CompilerOptOut | null => {
    const caches = countMemoCaches(ast);

    if (USE_NO_MEMO.test(source)) {
        return {
            file,
            status: caches > 0 ? 'opt-out-partial' : 'opt-out',
            reasons: ["'use no memo'"],
        };
    }

    const refusals = events.filter(
        ({ kind }) => kind === 'CompileError' || kind === 'PipelineError',
    );
    if (refusals.length === 0) {
        return null;
    }

    return {
        file,
        status: caches > 0 ? 'partial' : 'bail',
        // Sorted, not in emission order: a file refused for two reasons must produce one stable
        // line, or the snapshot churns on a difference that means nothing.
        reasons: [
            ...new Set(refusals.map(({ reason }) => reason ?? '<no reason reported>')),
        ].sort(),
    };
};

/** Repo-root-relative, so the gate and the update command agree on one location. */
export const OPT_OUT_SNAPSHOT_FILE = 'packages/suite-build/react-compiler-bail-snapshot.txt';

/** `<path>\t<status>\t<reasons>`, ASCII-sorted. No line numbers — they churn without meaning. */
export const formatOptOutSnapshot = (optOuts: readonly CompilerOptOut[]): string =>
    optOuts
        .map(({ file, status, reasons }) => `${file}\t${status}\t${reasons.join('; ')}`)
        .sort()
        .join('\n');

type SnapshotLine = { status: string; reasons: string };

const parseOptOutSnapshot = (snapshot: string): Map<string, SnapshotLine> => {
    const rows = new Map<string, SnapshotLine>();

    snapshot
        .split('\n')
        .filter(line => line.trim() !== '')
        .forEach(line => {
            const [file = '', status = '', reasons = ''] = line.split('\t');
            rows.set(file, { status, reasons });
        });

    return rows;
};

const UPDATE_COMMAND = 'yarn workspace @trezor/suite-build react-compiler:check --update-snapshot';

/**
 * Compares the opt-out inventory against its committed snapshot.
 *
 * Every direction fails, but for opposite reasons. A file *entering* the set is a performance
 * regression that fails open — it behaves exactly as it did before the rollout, so nothing can
 * break. A file *leaving* the set is a correctness regression that fails closed: code nobody
 * reviewed for the hazard classes is memoized for the first time, and the trigger is usually
 * unrelated to the file — deleting an `eslint-disable`, adding a `catch {}` to satisfy a lint rule,
 * or bumping the compiler.
 */
export const evaluateOptOutSnapshot = (
    committed: string,
    current: string,
    directories: readonly string[] = REACT_COMPILER_PATHS,
): string[] => {
    const failures: string[] = [];

    // Same reasoning as the `report.compiled === 0` guard: an inventory that quietly stops being
    // collected matches an emptied snapshot forever and reports nothing again.
    if (directories.length > 0 && current.trim() === '') {
        failures.push(
            `Scanned ${directories.join(', ')} and found no file the React Compiler refuses or ` +
                `that opts out — not even a \`'use no memo'\`. That is not plausible; the inventory ` +
                `has most likely stopped being collected.`,
        );

        return failures;
    }

    const expected = parseOptOutSnapshot(committed);
    const actual = parseOptOutSnapshot(current);

    actual.forEach(({ status, reasons }, file) => {
        const before = expected.get(file);

        if (before === undefined) {
            failures.push(
                `${file} is not compiled (${status}: ${reasons}) and is not in ` +
                    `${OPT_OUT_SNAPSHOT_FILE}. It ships unoptimized from now on. If that is ` +
                    `intended, record it with \`${UPDATE_COMMAND}\`.`,
            );

            return;
        }

        if (before.status !== status || before.reasons !== reasons) {
            failures.push(
                `${file} is still not compiled but for a different reason — was ` +
                    `"${before.status}: ${before.reasons}", now "${status}: ${reasons}". ` +
                    `babel-plugin-react-compiler has most likely changed; confirm the new reason is ` +
                    `benign before recording it with \`${UPDATE_COMMAND}\`.`,
            );
        }
    });

    expected.forEach(({ status, reasons }, file) => {
        if (actual.has(file)) {
            return;
        }

        failures.push(
            `${file} is compiled now; it used to be skipped ("${status}: ${reasons}"). Its code is ` +
                `memoized for the first time and nothing reviewed it for that. A green ` +
                `react-compiler:check afterwards is not evidence it is safe: this gate only sees a ` +
                `react-hook-form accessor read during render and an impure value captured by a ` +
                `cached closure. Read the file for values that must not be cached — a ref read, a ` +
                `latest-value ref, a subscription — then record it with \`${UPDATE_COMMAND}\`.`,
        );
    });

    return failures;
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
        frozenCaptures: [],
        suppressedFiles: [],
        optOuts: [],
        unknownGuardShapes: [],
        transformErrors: [],
    };

    directories.forEach(directory => {
        listSourceFiles(path.join(root, directory)).forEach(filename => {
            const file = path.relative(root, filename).split(path.sep).join('/');
            const source = readFileSync(filename, 'utf-8');
            report.files += 1;

            const compiled = compileForAnalysis(source, filename);
            if ('error' in compiled) {
                report.transformErrors.push({ file, error: compiled.error });

                return;
            }

            const suppressed = findSuppressedFile(source, filename, file, compiled.ast);
            if (suppressed !== null) {
                report.suppressedFiles.push(suppressed);
            }

            const optOut = classifyCompilerOptOut(source, file, compiled.ast, compiled.events);
            if (optOut !== null) {
                report.optOuts.push(optOut);
            }

            const analysis = analyseCompiledModule(compiled.ast, file);

            if (analysis.guards > 0) {
                report.compiled += 1;
                report.guards += analysis.guards;
            }

            report.findings.push(...analysis.findings);
            report.impureCaches.push(...analysis.impureCaches);
            report.frozenCaptures.push(...analysis.frozenCaptures);
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

const describeFrozenCapture = ({
    file,
    line,
    column,
    global: name,
    binding,
    readLine,
    owner,
    depCount,
}: FrozenCaptureFinding) =>
    `${file}:${line}:${column}  a cached closure captures \`${binding}\` (${name}, read at ` +
    `${file}:${readLine})  in ${owner ?? '<anonymous>'}, ` +
    `${depCount === 0 ? 'built once on the first render and never again' : `rebuilt only when one of ${depCount} dependencies changes`}`;

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

    report.frozenCaptures.forEach(capture =>
        failures.push(
            `${describeFrozenCapture(capture)} — so it keeps serving the value read on the render ` +
                `that filled the cache. Read the impure value inside the closure instead, where it ` +
                `is evaluated every time the closure runs, or derive it from state the compiler can ` +
                `track. \`react-hooks/purity\` reports the read, never the freeze.`,
        ),
    );

    return failures;
};
