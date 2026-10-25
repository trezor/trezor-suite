/**
 * Matches the bundler worker idiom `new Worker(new URL('<specifier>', import.meta.url))` on the
 * NodePath of the inner `new URL(...)`. Only that shape carries a module specifier; every other
 * `new URL(...)` builds a runtime address — `new URL('./api/status', origin)`, or
 * `readFileSync(new URL('./assets', import.meta.url))` for a file sitting next to the module —
 * that must be left untouched.
 *
 * Shared by babel-plugin-sanitize-internal-imports.js and babel-plugin-add-js-extension.js: both
 * run over the same NewExpression in one pass, so a drift between two copies of this gate would
 * emit a half-transformed specifier (src→lib without the extension, or the other way round).
 */
const workerConstructors = ['Worker', 'SharedWorker'];

const isImportMetaUrl = (types, node) =>
    types.isMemberExpression(node) &&
    types.isMetaProperty(node.object) &&
    node.object.meta.name === 'import' &&
    node.object.property.name === 'meta' &&
    types.isIdentifier(node.property, { name: 'url' });

export const isWorkerUrl = (types, nodePath) => {
    if (!isImportMetaUrl(types, nodePath.node.arguments[1])) return false;

    const parent = nodePath.parentPath;

    return (
        !!parent?.isNewExpression() &&
        types.isIdentifier(parent.node.callee) &&
        workerConstructors.includes(parent.node.callee.name) &&
        parent.node.arguments[0] === nodePath.node
    );
};
