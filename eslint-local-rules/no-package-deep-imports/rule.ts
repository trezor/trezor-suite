import type { Rule } from 'eslint';

import { createImportExportVisitors, getNodeSourcePath } from '../utils';

/**
 * Returns the suggested import path for a deep import, or null if the import is allowed.
 * Imports below a configured entry point suggest that entry point instead of the package root.
 */
const getSuggestedImportPath = (
    sourcePath: string,
    packageScopes: string[],
    ignoredPackages: string[],
    allowedEntryPointPatterns: RegExp[],
): string | null => {
    const sourcePathParts = sourcePath.split('/');

    if (sourcePathParts.length < 3) {
        return null;
    }

    const matchingPackageScope = packageScopes.find(packageScope =>
        sourcePath.startsWith(`${packageScope}/`),
    );

    if (matchingPackageScope === undefined) {
        return null;
    }

    const packageImportPath = `${matchingPackageScope}/${sourcePathParts[1]}`;

    if (ignoredPackages.includes(packageImportPath)) {
        return null;
    }

    // Check the full import path and each of its parent paths against the allowed entry points.
    const sourcePathPrefixes = sourcePathParts.map((_, index) =>
        sourcePathParts.slice(0, index + 1).join('/'),
    );
    const allowedEntryPoint = sourcePathPrefixes.find(entryPoint =>
        allowedEntryPointPatterns.some(entryPointPattern => entryPointPattern.test(entryPoint)),
    );

    if (allowedEntryPoint !== undefined) {
        return sourcePath === allowedEntryPoint ? null : allowedEntryPoint;
    }

    return packageImportPath;
};

export const noPackageDeepImportsRule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallows deep imports from selected package scopes and enforces package entry points.',
            category: 'Best Practices',
            recommended: false,
        },
        messages: {
            doNotImportPackageDeepPath:
                "Importing from '{{sourcePath}}' is not allowed. Use '{{packageImportPath}}' instead.",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    packageScopes: {
                        type: 'array',
                        items: { type: 'string' },
                        minItems: 1,
                    },
                    ignoredPackages: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                    allowedEntryPointPatterns: {
                        type: 'array',
                        items: { type: 'object' },
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    create(context) {
        const packageScopes = context.options[0]?.packageScopes ?? [
            '@suite-native',
            '@suite',
            '@suite-common',
            '@trezor',
        ];
        const ignoredPackages = context.options[0]?.ignoredPackages ?? [];
        const allowedEntryPointPatterns = context.options[0]?.allowedEntryPointPatterns ?? [];

        const checkNode = (node: Rule.Node) => {
            const sourcePath = getNodeSourcePath(node);

            if (sourcePath === null) {
                return;
            }

            const packageImportPath = getSuggestedImportPath(
                sourcePath,
                packageScopes,
                ignoredPackages,
                allowedEntryPointPatterns,
            );

            if (packageImportPath === null) {
                return;
            }

            context.report({
                node,
                messageId: 'doNotImportPackageDeepPath',
                data: {
                    packageImportPath,
                    sourcePath,
                },
            });
        };

        return createImportExportVisitors(checkNode);
    },
};
