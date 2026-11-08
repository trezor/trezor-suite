import fs from 'node:fs';
import path from 'node:path';

import { isWorkerUrl } from './is-worker-url.js';

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

// A bundler ?query / #fragment suffix is not part of the path: the extension goes before it, and
// the file-vs-directory stat must not see it. The segment boundary it marks is the one
// internalSrcSpecifier pins in babel-plugin-sanitize-internal-imports.js.
const splitSuffix = specifier => {
    const at = specifier.search(/[?#]/);

    return at === -1 ? [specifier, ''] : [specifier.slice(0, at), specifier.slice(at)];
};

// Locate the src/ tree of the imported @trezor package. It is a workspace package symlinked into
// node_modules, so walking the node_modules chain up from the file being transformed finds it in
// any layout: packages/<pkg> as well as the networks/<chain>/<pkg> workspaces, whose package root
// is not an ancestor of the file. The package directory is addressed directly because a manifest's
// exports map does not have to expose ./package.json, which rules out require.resolve.
const resolveLinkedPackageSrc = (filename, packageName) => {
    let dir = path.dirname(filename);

    while (dir !== path.dirname(dir)) {
        const src = path.join(dir, 'node_modules', '@trezor', packageName, 'src');
        if (fs.existsSync(src)) return src;
        dir = path.dirname(dir);
    }

    return null;
};

// Locate the packages root (the directory holding every @trezor package) from the absolute path of
// the file being transformed, i.e. the parent of the package directory whose lib/ holds the file.
// A path can contain several lib/ segments, so the candidates are validated rather than guessed:
// neither an ancestor directory named lib (a checkout under ~/lib) nor one nested in the package's
// own output (lib/device/lib/helpers.js) may be mistaken for the package's own lib/.
// e.g. /packages/connect/lib/device/thp/pairing.js → /packages/
const resolvePackagesRoot = (filename, packageName) => {
    const segment = `${path.sep}lib${path.sep}`;
    const innermost = filename.lastIndexOf(segment);

    // Walk the lib/ segments from the end and keep the first candidate that actually holds
    // <packageName>/src.
    let index = innermost;
    while (index > 0) {
        const candidate = path.dirname(filename.substring(0, index));
        if (fs.existsSync(path.join(candidate, packageName, 'src'))) return candidate;
        index = filename.lastIndexOf(segment, index - 1);
    }

    // No candidate holds the package: fall back to the innermost lib/, so the src/ stat below
    // misses and the specifier stays on the file branch, as before.
    return path.dirname(filename.substring(0, innermost));
};

// The node_modules link is authoritative; the lib/ segment walk stays as the fallback for a tree
// where the imported package is not installed.
const resolvePackageSrc = (filename, packageName) =>
    resolveLinkedPackageSrc(filename, packageName) ??
    path.join(resolvePackagesRoot(filename, packageName), packageName, 'src');

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
    const withExtension = (specifier, filename) => {
        const [src, suffix] = splitSuffix(specifier);

        // Handle @trezor package imports to lib
        if (isTrezorLibImport(src)) {
            const match = src.match(/^@trezor\/([^/]+)\/lib\/(.+)$/);
            const [, packageName, subpath] = match;

            // Check src/ instead of lib/ — src/ is always present in the repo regardless of
            // build order, whereas lib/ may not exist yet in CI when this package is compiled.
            const resolvedSrcPath = path.join(resolvePackageSrc(filename, packageName), subpath);

            const isDirectory =
                fs.existsSync(resolvedSrcPath) && fs.statSync(resolvedSrcPath).isDirectory();

            // e.g., @trezor/protocol/lib/protocol-tpn -> @trezor/protocol/lib/protocol-tpn/index.js
            // e.g., @trezor/protocol/lib/bigNumber -> @trezor/protocol/lib/bigNumber.js
            return isDirectory ? src + '/index.js' + suffix : src + '.js' + suffix;
        }

        // External CJS subpaths need .js for ESM
        if (isExternalCjsSubpath(src)) {
            return src + '.js' + suffix;
        }

        if (isRelativeImport(src)) {
            const currentFileDir = path.dirname(filename);
            const resolvedPath = path.resolve(currentFileDir, src);

            const isDirectory =
                fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory();

            return isDirectory ? src + '/index.js' + suffix : src + '.js' + suffix;
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
            // Bundler worker idiom: new Worker(new URL('<specifier>', import.meta.url)). The
            // guard keeps every other new URL(...) untouched, including an extensionless asset
            // path addressed with import.meta.url, which must not gain a .js extension.
            NewExpression(nodePath, state) {
                if (!types.isIdentifier(nodePath.node.callee, { name: 'URL' })) return;
                if (!isWorkerUrl(types, nodePath)) return;
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
