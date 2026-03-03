import type { Rule } from 'eslint';

const findNodeWithCalleeInSubTree = (node, calleeName) => {
    if (node.type === 'CallExpression' && node.callee.name === calleeName) {
        return node;
    }

    if (
        'callee' in node &&
        typeof node.callee === 'object' &&
        node.callee !== null &&
        'object' in node.callee
    ) {
        return findNodeWithCalleeInSubTree(node.callee.object, calleeName);
    }

    return null;
};

const checkNodeForAvoidStyledComponent = (node, context, nodeRef, importedComponents) => {
    if (node[nodeRef]?.type === 'CallExpression') {
        // We need to recursively search for the styled component in the call tree in case its chained
        //
        // Example:
        //      styled(Button).attrs(props => ({ ... {))`...`
        //
        const nodeWithCallee = findNodeWithCalleeInSubTree(node[nodeRef], 'styled');

        if (nodeWithCallee === null) {
            return;
        }

        if (
            nodeWithCallee.callee.name === 'styled' &&
            nodeWithCallee.arguments[0].type === 'Identifier'
        ) {
            const componentName = nodeWithCallee.arguments[0].name;

            // Check if component name matches any imported component from the specified packages
            for (const [pkgName, components] of importedComponents) {
                if (components.has(componentName)) {
                    context.report({
                        node,
                        messageId: 'avoidStyledComponent',
                        data: {
                            packageName: pkgName,
                        },
                    });
                    break;
                }
            }
        }
    }
};

/**
 * Returns the suggested import path for a deep import, or null if the import is allowed.
 * Handles the mocks convention: `@scope/pkg/mocks` is allowed, but `@scope/pkg/mocks/deep` suggests `@scope/pkg/mocks`.
 */
const getSuggestedImportPath = (
    sourcePath: string,
    packageScopes: string[],
    ignoredPackages: string[],
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

    // Allow @scope/pkg/mocks as a valid entry point
    if (sourcePathParts[2] === 'mocks') {
        if (sourcePathParts.length === 3) {
            return null;
        }

        return `${packageImportPath}/mocks`;
    }

    return packageImportPath;
};

const getNodeSourcePath = (node: Rule.Node): string | null => {
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

const normalizePathSeparators = (filePath: string) => filePath.replace(/\\/g, '/');

const isSuiteCommonFile = (filename: string) => filename.includes('/suite-common/');

const isSuiteOrSuiteNativeImport = (sourcePath: string) =>
    sourcePath.startsWith('@suite/') || sourcePath.startsWith('@suite-native/');

export const rules = {
    'no-override-ds-component': {
        meta: {
            type: 'problem',
            docs: {
                description:
                    'Disallows overriding components imported from a specific package using styled-components',

                category: 'Best Practices',
                recommended: false,
            },
            messages: {
                avoidStyledComponent:
                    "Please do not override components imported from '{{packageName}}'. Use wrapper component or ask Growth team for help.",
            },
            schema: [
                {
                    type: 'object',
                    properties: {
                        packageNames: {
                            type: 'array',
                            items: { type: 'string' },
                            minItems: 1,
                        },
                    },
                    additionalProperties: false,
                },
            ],
        },
        create(context) {
            const packageNames = context.options[0]?.packageNames || [];
            if (packageNames.length === 0) {
                return {};
            }

            const importedComponents = new Map<string, Set<string>>(); // Map to store components per package name

            return {
                ImportDeclaration(node) {
                    if (packageNames.includes(node.source.value)) {
                        node.specifiers.forEach(specifier => {
                            if (
                                specifier.type === 'ImportSpecifier' ||
                                specifier.type === 'ImportDefaultSpecifier'
                            ) {
                                if (!importedComponents.has(node.source.value)) {
                                    importedComponents.set(node.source.value, new Set<string>());
                                }
                                importedComponents.get(node.source.value).add(specifier.local.name);
                            }
                        });
                    }
                },

                // This is for case the styled component is assigned to a variable but not evaluated with `...`
                VariableDeclarator(node) {
                    checkNodeForAvoidStyledComponent(node, context, 'init', importedComponents);
                },

                // This for case when the standard styled(Component)`...` is used
                TaggedTemplateExpression(node) {
                    checkNodeForAvoidStyledComponent(node, context, 'tag', importedComponents);
                },
            };
        },
    },
    'no-package-deep-imports': {
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

            const checkNode = (node: Rule.Node) => {
                const sourcePath = getNodeSourcePath(node);

                if (sourcePath === null) {
                    return;
                }

                const packageImportPath = getSuggestedImportPath(
                    sourcePath,
                    packageScopes,
                    ignoredPackages,
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

            return {
                ImportDeclaration: checkNode,
                ExportAllDeclaration: checkNode,
                ExportNamedDeclaration: checkNode,
            };
        },
    },
    'no-suite-imports-in-suite-common': {
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

            return {
                ImportDeclaration: checkNode,
                ExportAllDeclaration: checkNode,
                ExportNamedDeclaration: checkNode,
            };
        },
    },
    'analytics-event-name': {
        meta: {
            type: 'suggestion',
            docs: {
                description:
                    'Enforces analytics EventType enum values to use format Domain/event with allowed domains and kebab-case for the event part.',
                category: 'Best Practices',
                recommended: false,
            },
            messages: {
                invalidFormat:
                    "Event name must be in format 'domain/event' (e.g. 'settings/app-log-exported'). Use one of the allowed domains and kebab-case for the event part.",
                invalidDomain:
                    "Invalid domain '{{domain}}'. Allowed: accounts, app, coin, dashboard, device, firmware, guide, menu, passphrase, promo, receive, send, settings, staking, trading, transaction, wallet-connect.",
                notKebabCase:
                    "Event part after domain must use kebab-case (e.g. 'app-log-exported'), got '{{eventPart}}'.",
            },
            schema: [],
        },
        create(context) {
            const ALLOWED_DOMAINS = new Set([
                'accounts',
                'app',
                'coin',
                'dashboard',
                'device',
                'firmware',
                'guide',
                'menu',
                'passphrase',
                'promo',
                'receive',
                'send',
                'settings',
                'staking',
                'trading',
                'transaction',
                'wallet-connect',
            ]);
            const KEBAB_CASE_SEGMENT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

            function validateEventName(
                value: string,
            ): { messageId: string; data?: Record<string, string> } | null {
                if (!value.includes('/')) {
                    return { messageId: 'invalidFormat' };
                }
                const parts = value.split('/');
                const domain = parts[0];
                const eventSegments = parts.slice(1);
                if (!ALLOWED_DOMAINS.has(domain)) {
                    return { messageId: 'invalidDomain', data: { domain } };
                }
                for (const segment of eventSegments) {
                    if (!KEBAB_CASE_SEGMENT.test(segment)) {
                        return { messageId: 'notKebabCase', data: { eventPart: value } };
                    }
                }

                return null;
            }

            return {
                TSEnumDeclaration(node: Rule.Node) {
                    const enumNode = node as Rule.Node & {
                        id?: { name?: string };
                        members?: Array<{
                            initializer?: Rule.Node & { type?: string; value?: string };
                        }>;
                    };
                    if (enumNode.id?.name !== 'EventType') {
                        return;
                    }

                    for (const member of enumNode.members ?? []) {
                        const { initializer } = member;
                        if (
                            initializer?.type !== 'Literal' ||
                            typeof initializer.value !== 'string'
                        ) {
                            continue;
                        }

                        const error = validateEventName(initializer.value);
                        if (error) {
                            context.report({
                                node: initializer,
                                messageId: error.messageId,
                                data: error.data ?? {},
                            });
                        }
                    }
                },
            };
        },
    },
} as const satisfies Record<string, Rule.RuleModule>;
