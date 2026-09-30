const sanitizeInternalImports = (src, moduleType) => {
    const searchValue = new RegExp('@trezor/([^/]+)/src', 'g');

    if (moduleType === 'cjs' && searchValue.test(src)) {
        throw new Error(
            `Cannot sanitize internal require, Connect does not support CJS anymore, got: ${src}`,
        );
    }

    const replaceValue = `@trezor/$1/lib`;

    return src.replace(searchValue, replaceValue);
};

const sanitizeDynamicImport = src =>
    // Manually replace .ts extensions with .js (for dynamic imports)
    src.replace(/\.ts(['"`]|$)/g, '.js$1');
/**
 * Babel plugin to sanitize non-index internal imports, from src to the built lib folder.
 * e.g. @trezor/utils/src/bufferUtils → @trezor/utils/lib/bufferUtils
 */
const sanitizeInternalImportsPlugin = ({ types }) => {
    // Matches the `import.meta.url` node. Only `new URL('<specifier>', import.meta.url)` carries a
    // module specifier; every other `new URL(...)` builds a runtime address that must be left alone.
    const isImportMetaUrl = node =>
        types.isMemberExpression(node) &&
        types.isMetaProperty(node.object) &&
        node.object.meta.name === 'import' &&
        node.object.property.name === 'meta' &&
        types.isIdentifier(node.property, { name: 'url' });

    const modifyESMImportPath = path => {
        const src = path.node.source?.value;
        if (!src) return;
        path.node.source = types.stringLiteral(sanitizeInternalImports(src, 'esm'));
    };

    const modifyCJSRequireArg = path => {
        const args = path.node.arguments;
        if (!args || args.length === 0) return;
        const first = args[0];
        if (!types.isStringLiteral(first)) return;
        first.value = sanitizeInternalImports(first.value, 'cjs');
    };

    const modifyTemplateLiteral = path => {
        const { quasis } = path.node;
        if (!quasis || quasis.length === 0) return;

        quasis.forEach(quasi => {
            if (quasi.value && quasi.value.raw) {
                quasi.value.raw = sanitizeDynamicImport(quasi.value.raw);
                quasi.value.cooked = sanitizeDynamicImport(quasi.value.cooked || quasi.value.raw);
            }
        });
    };

    return {
        name: 'sanitize-internal-imports',
        visitor: {
            // handle ESM import/export statements
            ImportDeclaration(path) {
                modifyESMImportPath(path);
            },
            ExportAllDeclaration(path) {
                modifyESMImportPath(path);
            },
            ExportNamedDeclaration(path) {
                modifyESMImportPath(path);
            },
            // handle CJS require(...) and require.resolve('...') statements
            CallExpression(path) {
                const { callee } = path.node;
                if (types.isIdentifier(callee) && callee.name === 'require') {
                    modifyCJSRequireArg(path);
                } else if (types.isImport(callee)) {
                    // Handle dynamic import() with string literal.
                    // e.g. import("@trezor/blockchain-link/src/workers/solana") → import("@trezor/blockchain-link/lib/workers/solana")
                    const args = path.node.arguments;
                    if (args?.length > 0 && types.isStringLiteral(args[0])) {
                        args[0].value = sanitizeInternalImports(args[0].value, 'esm');
                    }
                } else if (
                    types.isMemberExpression(callee) &&
                    types.isIdentifier(callee.object) &&
                    callee.object.name === 'require' &&
                    types.isIdentifier(callee.property) &&
                    callee.property.name === 'resolve'
                ) {
                    modifyCJSRequireArg(path);
                }
            },
            // handle the bundler worker idiom: new Worker(new URL('<specifier>', import.meta.url)).
            // e.g. new URL('@trezor/blockchain-link/src/workers/blockbook', import.meta.url)
            //   → new URL('@trezor/blockchain-link/lib/workers/blockbook', import.meta.url)
            // Published packages ship lib/ only, so a /src specifier cannot resolve for consumers.
            // The import.meta.url guard keeps runtime new URL('<path>', base) calls untouched.
            NewExpression(path) {
                if (!types.isIdentifier(path.node.callee, { name: 'URL' })) return;
                const [first, second] = path.node.arguments;
                if (!isImportMetaUrl(second)) return;
                if (!types.isStringLiteral(first)) return;
                first.value = sanitizeInternalImports(first.value, 'esm');
            },
            // handle template literals (for dynamic imports with template strings)
            TemplateLiteral(path) {
                modifyTemplateLiteral(path);
            },
        },
    };
};

export default sanitizeInternalImportsPlugin;
