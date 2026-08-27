import type { Rule } from 'eslint';

import { createImportExportVisitors, getNodeSourcePath } from '../utils';

const normalizePathSeparators = (filePath: string) => filePath.replace(/\\/g, '/');

const isSuiteCommonFile = (filename: string) => filename.includes('/suite-common/');

const isSuiteOrSuiteNativeImport = (sourcePath: string) =>
    sourcePath.startsWith('@suite/') || sourcePath.startsWith('@suite-native/');

export const noSuiteImportsInSuiteCommonRule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallows imports from suite and suite-native packages in suite-common code.',
            category: 'Best Practices',
            recommended: false,
        },
        messages: {
            doNotImportSuiteIntoSuiteCommon:
                "Importing from '{{sourcePath}}' is not allowed in suite-common. Move shared code to @suite-common or @trezor package.",
        },
        schema: [],
    },
    create(context) {
        const filename =
            'filename' in context && typeof context.filename === 'string'
                ? normalizePathSeparators(context.filename)
                : null;

        if (filename === null || !isSuiteCommonFile(filename)) {
            return {};
        }

        const checkNode = (node: Rule.Node) => {
            const sourcePath = getNodeSourcePath(node);

            if (sourcePath === null || !isSuiteOrSuiteNativeImport(sourcePath)) {
                return;
            }

            context.report({
                node,
                messageId: 'doNotImportSuiteIntoSuiteCommon',
                data: {
                    sourcePath,
                },
            });
        };

        return createImportExportVisitors(checkNode);
    },
};
