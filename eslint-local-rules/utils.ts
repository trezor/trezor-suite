import type { Rule } from 'eslint';

export const getNodeSourcePath = (node: Rule.Node): string | null => {
    if (
        'source' in node &&
        node.source &&
        typeof node.source === 'object' &&
        'value' in node.source &&
        typeof node.source.value === 'string'
    ) {
        return node.source.value;
    }

    return null;
};

export const createImportExportVisitors = (checkNode: (node: Rule.Node) => void) => ({
    ImportDeclaration: checkNode,
    ExportAllDeclaration: checkNode,
    ExportNamedDeclaration: checkNode,
});
