import fs from 'node:fs';
import path from 'node:path';

// Match relative imports without extension: "./x", "../x", "./x/y"
const isRelativeImport = src => src.startsWith('.') && !path.extname(src);
const isRelativeJsImport = src => src.startsWith('.') && path.extname(src) === '.js';

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
 * - File imports: ./utils/helper → ./utils/helper.mjs
 * - Directory imports: ./constants → ./constants/index.mjs
 * - @trezor package imports: @trezor/utils/lib/bigNumber → @trezor/utils/lib/bigNumber.mjs
 * - External CJS subpaths: some-package/subpath → some-package/subpath.js
 */
const addEsmExtensionPlugin = ({ types }) => {
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

        // Handle @trezor package imports to lib
        if (isTrezorLibImport(src)) {
            const match = src.match(/^@trezor\/([^/]+)\/lib\/(.+)$/);
            const [, packageName, subpath] = match;

            // Find packages/ root from the current file's absolute path by locating the lib/ segment.
            // e.g., /packages/connect/lib/device/thp/pairing.js → /packages/
            const libIndex = state.filename.indexOf(`${path.sep}lib${path.sep}`);
            const packageDir = state.filename.substring(0, libIndex);
            const packagesRoot = path.dirname(packageDir);
            // Check src/ instead of lib/ — src/ is always present in the repo regardless of
            // build order, whereas lib/ may not exist yet in CI when this package is compiled.
            const resolvedSrcPath = path.join(packagesRoot, packageName, 'src', subpath);

            const isDirectory =
                fs.existsSync(resolvedSrcPath) && fs.statSync(resolvedSrcPath).isDirectory();

            // e.g., @trezor/protocol/lib/protocol-tpn -> @trezor/protocol/lib/protocol-tpn/index.js
            // e.g., @trezor/protocol/lib/bigNumber -> @trezor/protocol/lib/bigNumber.js
            if (isDirectory) {
                nodePath.node.source = types.stringLiteral(src + '/index.mjs');
            } else {
                nodePath.node.source = types.stringLiteral(src + '.mjs');
            }

            return;
        }

        // External CJS subpaths need .js for ESM
        if (isExternalCjsSubpath(src)) {
            nodePath.node.source = types.stringLiteral(src + '.js');

            return;
        }

        if (isRelativeImport(src)) {
            const currentFileDir = path.dirname(state.filename);
            const resolvedPath = path.resolve(currentFileDir, src);

            const isDirectory =
                fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory();

            if (isDirectory) {
                nodePath.node.source = types.stringLiteral(src + '/index.mjs');
            } else {
                nodePath.node.source = types.stringLiteral(src + '.mjs');
            }

            return;
        }

        if (isRelativeJsImport(src)) {
            const currentFileDir = path.dirname(state.filename);
            const resolvedPath = path.resolve(currentFileDir, src);

            if (fs.existsSync(resolvedPath)) {
                nodePath.node.source = types.stringLiteral(src.replace(/\.js$/, '.mjs'));
            }
        }
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
        },
    };
};

export default addEsmExtensionPlugin;
