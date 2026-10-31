/**
 * Matches the bundler module-reference idiom `new URL('<specifier>', import.meta.url)` on the
 * NodePath of that `new URL(...)`, in the positions a bundler resolves as a module reference: the
 * first argument of `new Worker` / `new SharedWorker`, or of a `*.register(...)` /
 * `*.addModule(...)` call. Only those positions carry a module specifier; every other
 * `new URL(...)` builds a runtime address — `new URL('./api/status', origin)`, or
 * `readFileSync(new URL('./assets', import.meta.url))` for a file sitting next to the module —
 * that must be left untouched.
 *
 * Shared by babel-plugin-sanitize-internal-imports.js and babel-plugin-add-js-extension.js: both
 * run over the same NewExpression in one pass, so a drift between two copies of this gate would
 * emit a half-transformed specifier (src→lib without the extension, or the other way round).
 */
const workerConstructors = ['Worker', 'SharedWorker'];

// Call positions a bundler also resolves as a module reference with an import.meta.url base:
// navigator.serviceWorker.register(...) and audioWorklet.addModule(...). Matched on the property
// name alone, so an unrelated `foo.register(new URL(...))` matches too — no such call site exists
// today, and rewriting one is the safe direction: the alternative is shipping it extensionless.
const moduleReferenceCallees = ['register', 'addModule'];

const isImportMetaUrl = (types, node) =>
    types.isMemberExpression(node) &&
    types.isMetaProperty(node.object) &&
    node.object.meta.name === 'import' &&
    node.object.property.name === 'meta' &&
    types.isIdentifier(node.property, { name: 'url' });

const isModuleReferenceParent = (types, parent, node) => {
    if (parent.isNewExpression()) {
        return (
            types.isIdentifier(parent.node.callee) &&
            workerConstructors.includes(parent.node.callee.name) &&
            parent.node.arguments[0] === node
        );
    }

    // Babel gives an optional chain its own node types (`a?.b()` is an OptionalCallExpression over
    // an OptionalMemberExpression); the bundlers parse with acorn, which keeps the plain
    // CallExpression, so both spellings are the same module-reference position and both are matched
    // here — `navigator.serviceWorker` is absent in insecure contexts, so `?.register(...)` is the
    // spelling authors actually write.
    if (parent.isCallExpression() || parent.isOptionalCallExpression()) {
        const { callee } = parent.node;

        return (
            (types.isMemberExpression(callee) || types.isOptionalMemberExpression(callee)) &&
            types.isIdentifier(callee.property) &&
            moduleReferenceCallees.includes(callee.property.name) &&
            parent.node.arguments[0] === node
        );
    }

    return false;
};

export const isWorkerUrl = (types, nodePath) => {
    if (!isImportMetaUrl(types, nodePath.node.arguments[1])) return false;

    const parent = nodePath.parentPath;

    return !!parent && isModuleReferenceParent(types, parent, nodePath.node);
};
