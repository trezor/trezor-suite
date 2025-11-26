import path from 'node:path';

// only rewrite: "./x", "../x", "./x/y", but not "./x.js", "../x.ts", "lodash", "@trezor/lib"
const shouldAddExtension = src => src.startsWith('.') && !path.extname(src);

/**
 * Babel plugin to add .js extension to import/export statements, used for valid ESM builds.
 * This way we can keep our codebase with moduleResolution: bundler (imports without extensions).
 */
const addJSExtensionPlugin = ({ types }) => {
    const modifyPath = path => {
        const src = path.node.source?.value;
        if (src && shouldAddExtension(src)) {
            path.node.source = types.stringLiteral(src + '.js');
        }
    };

    return {
        name: 'add-js-extension',
        visitor: {
            ImportDeclaration(path) {
                modifyPath(path);
            },
            ExportAllDeclaration(path) {
                modifyPath(path);
            },
            ExportNamedDeclaration(path) {
                modifyPath(path);
            },
        },
    };
};

export default addJSExtensionPlugin;
