import fs from 'node:fs';
import path from 'node:path';

// Match relative imports without extension: "./x", "../x", "./x/y"
const isRelativeImport = src => src.startsWith('.') && !path.extname(src);

// Match @trezor package imports to libESM without extension: "@trezor/utils/libESM/bigNumber"
const trezorLibESMPattern = /^@trezor\/[^/]+\/libESM\/[^.]+$/;
const isTrezorLibESMImport = src => trezorLibESMPattern.test(src);

// External CJS packages that need .js extension for Node ESM compatibility
// These packages don't have proper "exports" in their package.json
const externalCjsSubpaths = [];
const isExternalCjsSubpath = src => externalCjsSubpaths.includes(src);

const externalJsonImports = ['bitcoin-ops'];

/**
 * Babel plugin to add .js extension to import/export statements, used for valid ESM builds.
 * This way we can keep our codebase with moduleResolution: bundler (imports without extensions).
 *
 * For Node.js ESM compatibility:
 * - File imports: ./utils/helper → ./utils/helper.js
 * - Directory imports: ./constants → ./constants/index.js
 * - @trezor package imports: @trezor/utils/libESM/bigNumber → @trezor/utils/libESM/bigNumber.js
 */
const addJSExtensionPlugin = ({ types }) => {
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

        // Handle @trezor package imports to libESM
        if (isTrezorLibESMImport(src)) {
            const match = src.match(/^@trezor\/([^/]+)\/libESM\/(.+)$/);
            const [, packageName, subpath] = match;

            // Find packages/ root from the current file's absolute path by locating the libESM/ segment.
            // e.g., /packages/connect/libESM/device/thp/pairing.js → /packages/
            const libESMIndex = state.filename.indexOf(`${path.sep}libESM${path.sep}`);
            const packageDir = state.filename.substring(0, libESMIndex);
            const packagesRoot = path.dirname(packageDir);
            // Check src/ instead of libESM/ — src/ is always present in the repo regardless of
            // build order, whereas libESM/ may not exist yet in CI when this package is compiled.
            const resolvedSrcPath = path.join(packagesRoot, packageName, 'src', subpath);

            const isDirectory =
                fs.existsSync(resolvedSrcPath) && fs.statSync(resolvedSrcPath).isDirectory();

            // e.g., @trezor/protocol/libESM/protocol-tpn -> @trezor/protocol/libESM/protocol-tpn/index.js
            // e.g., @trezor/protocol/libESM/bigNumber -> @trezor/protocol/libESM/bigNumber.js
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
        }
    };

    return {
        name: 'add-js-extension',
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

export default addJSExtensionPlugin;
