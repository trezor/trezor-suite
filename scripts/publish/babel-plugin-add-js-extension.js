import fs from 'node:fs';
import path from 'node:path';

// Match relative imports without extension: "./x", "../x", "./x/y"
const isRelativeImport = src => src.startsWith('.') && !path.extname(src);

// Match @trezor package imports to lib without extension: "@trezor/utils/lib/bigNumber"
const trezorLibPattern = /^@trezor\/[^/]+\/lib\/[^.]+$/;
const isTrezorLibImport = src => trezorLibPattern.test(src);

// External CJS packages that need .js extension for Node ESM compatibility
// These packages don't have proper "exports" in their package.json
const externalCjsSubpaths = [];
const isExternalCjsSubpath = src => externalCjsSubpaths.includes(src);

const externalJsonImports = [];

/**
 * Babel plugin to rewrite import/export statements to their runtime ESM extensions.
 * This way we can keep our codebase with moduleResolution: bundler (imports without extensions).
 *
 * For Node.js ESM compatibility:
 * - File imports: ./utils/helper → ./utils/helper.js
 * - Directory imports: ./constants → ./constants/index.js
 * - @trezor package imports: @trezor/utils/lib/bigNumber → @trezor/utils/lib/bigNumber.js
 * - External CJS subpaths: some-package/subpath → some-package/subpath.js
 */
const addEsmExtensionPlugin = ({ types }) => {
    // Returns the specifier with its runtime extension, or null when it needs no change.
    const withExtension = (src, filename) => {
        // Handle @trezor package imports to lib
        if (isTrezorLibImport(src)) {
            const match = src.match(/^@trezor\/([^/]+)\/lib\/(.+)$/);
            const [, packageName, subpath] = match;

            // Find packages/ root from the current file's absolute path by locating the lib/ segment.
            // e.g., /packages/connect/lib/device/thp/pairing.js → /packages/
            const libIndex = filename.indexOf(`${path.sep}lib${path.sep}`);
            const packageDir = filename.substring(0, libIndex);
            const packagesRoot = path.dirname(packageDir);
            // Check src/ instead of lib/ — src/ is always present in the repo regardless of
            // build order, whereas lib/ may not exist yet in CI when this package is compiled.
            const resolvedSrcPath = path.join(packagesRoot, packageName, 'src', subpath);

            const isDirectory =
                fs.existsSync(resolvedSrcPath) && fs.statSync(resolvedSrcPath).isDirectory();

            // e.g., @trezor/protocol/lib/protocol-tpn -> @trezor/protocol/lib/protocol-tpn/index.js
            // e.g., @trezor/protocol/lib/bigNumber -> @trezor/protocol/lib/bigNumber.js
            return isDirectory ? src + '/index.js' : src + '.js';
        }

        // External CJS subpaths need .js for ESM
        if (isExternalCjsSubpath(src)) {
            return src + '.js';
        }

        if (isRelativeImport(src)) {
            const currentFileDir = path.dirname(filename);
            const resolvedPath = path.resolve(currentFileDir, src);

            const isDirectory =
                fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory();

            return isDirectory ? src + '/index.js' : src + '.js';
        }

        return null;
    };

    const modifyPath = (nodePath, state) => {
        const src = nodePath.node.source?.value;
        if (!src) return;

        // Add with { type: 'json' } to JSON imports for Node.js ESM compatibility
        if (
            (src.endsWith('.json') || externalJsonImports.includes(src)) &&
            !nodePath.node.attributes?.length
        ) {
            nodePath.node.attributes = [
                types.importAttribute(types.identifier('type'), types.stringLiteral('json')),
            ];

            return;
        }

        const next = withExtension(src, state.filename);
        if (next) nodePath.node.source = types.stringLiteral(next);
    };

    // Rewrites a specifier held directly in a string literal node, for the positions that do not
    // have a `source` property: dynamic import(), new URL() and .d.ts inline import() types.
    const modifyStringLiteral = (node, state) => {
        if (!types.isStringLiteral(node)) return;

        const next = withExtension(node.value, state.filename);
        if (next) node.value = next;
    };

    return {
        name: 'add-esm-extension',
        visitor: {
            ImportDeclaration(nodePath, state) {
                modifyPath(nodePath, state);
            },
            ExportAllDeclaration(nodePath, state) {
                modifyPath(nodePath, state);
            },
            ExportNamedDeclaration(nodePath, state) {
                modifyPath(nodePath, state);
            },
            // Dynamic import("@trezor/blockchain-link/lib/workers/solana") resolves to a directory
            // without this, which Node ESM cannot import.
            CallExpression(nodePath, state) {
                if (!types.isImport(nodePath.node.callee)) return;
                modifyStringLiteral(nodePath.node.arguments[0], state);
            },
            // Bundler worker idiom: new Worker(new URL('<specifier>', import.meta.url)).
            NewExpression(nodePath, state) {
                if (!types.isIdentifier(nodePath.node.callee, { name: 'URL' })) return;
                modifyStringLiteral(nodePath.node.arguments[0], state);
            },
            // Inline import("...") types in .d.ts files.
            TSImportType(nodePath, state) {
                modifyStringLiteral(nodePath.node.argument, state);
            },
        },
    };
};

export default addEsmExtensionPlugin;
