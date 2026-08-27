import type { Rule } from 'eslint';
import ts from 'typescript';

type TypeAwareParserServices = {
    esTreeNodeToTSNodeMap?: ReadonlyMap<Rule.Node, ts.Node>;
    program?: ts.Program;
    tsNodeToESTreeNodeMap?: ReadonlyMap<ts.Node, Rule.Node>;
};

type IntersectionMember = {
    name: string;
    node: ts.TypeNode;
    type: ts.Type;
};

type ContractUsage = {
    path: string[];
    requiredType?: ts.Type;
};

type IntersectionContract = {
    isOpaque: boolean;
    members: IntersectionMember[];
    name: string;
    symbol: ts.Symbol;
    usages: ContractUsage[];
};

const contractTypeNamePattern = /(?:State|Deps)$/;

const isInsideTypeNode = (node: ts.Node) => {
    let currentNode: ts.Node | undefined = node.parent;

    while (currentNode !== undefined && !ts.isStatement(currentNode)) {
        if (ts.isTypeNode(currentNode)) {
            return true;
        }

        currentNode = currentNode.parent;
    }

    return false;
};

const isNodeDeclarationName = (node: ts.Node) =>
    !ts.isShorthandPropertyAssignment(node.parent) &&
    (node.parent as ts.Node & { name?: ts.Node }).name === node;

const getAliasedContract = (
    node: ts.Expression,
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract>,
    checker: ts.TypeChecker,
) => {
    const type = checker.getTypeAtLocation(node);

    return type.aliasSymbol === undefined ? undefined : contractsBySymbol.get(type.aliasSymbol);
};

const getExpectedArgumentType = (
    callExpression: ts.CallExpression | ts.NewExpression,
    argument: ts.Expression,
    checker: ts.TypeChecker,
) => {
    const argumentIndex = callExpression.arguments?.indexOf(argument) ?? -1;
    const signature = checker.getResolvedSignature(callExpression);

    if (argumentIndex < 0 || signature === undefined) {
        return undefined;
    }

    const parameters = signature.getParameters();
    const parameter = parameters[Math.min(argumentIndex, parameters.length - 1)];

    if (parameter === undefined) {
        return undefined;
    }

    return checker.getTypeOfSymbolAtLocation(parameter, callExpression);
};

const isTransparentExpression = (node: ts.Node, expression: ts.Expression) =>
    (ts.isParenthesizedExpression(node) ||
        ts.isAsExpression(node) ||
        ts.isTypeAssertionExpression(node) ||
        ts.isNonNullExpression(node) ||
        ts.isAwaitExpression(node)) &&
    node.expression === expression;

const addContractUsage = (
    rootExpression: ts.Expression,
    contract: IntersectionContract,
    checker: ts.TypeChecker,
) => {
    const path: string[] = [];
    let terminalExpression = rootExpression;
    let { parent } = terminalExpression;

    while (parent !== undefined) {
        if (ts.isPropertyAccessExpression(parent) && parent.expression === terminalExpression) {
            path.push(parent.name.text);
            terminalExpression = parent;
            parent = terminalExpression.parent;
            continue;
        }

        if (ts.isElementAccessExpression(parent) && parent.expression === terminalExpression) {
            const property = parent.argumentExpression;

            if (ts.isStringLiteralLike(property) || ts.isNumericLiteral(property)) {
                path.push(property.text);
                terminalExpression = parent;
                parent = terminalExpression.parent;
                continue;
            }

            contract.isOpaque = true;

            return;
        }

        if (isTransparentExpression(parent, terminalExpression)) {
            terminalExpression = parent as ts.Expression;
            parent = terminalExpression.parent;
            continue;
        }

        break;
    }

    if (
        (ts.isCallExpression(parent) || ts.isNewExpression(parent)) &&
        parent.arguments?.includes(terminalExpression)
    ) {
        const requiredType = getExpectedArgumentType(parent, terminalExpression, checker);

        if (requiredType === undefined) {
            contract.isOpaque = true;

            return;
        }

        contract.usages.push({ path, requiredType });

        return;
    }

    if (
        ts.isVariableDeclaration(parent) &&
        parent.initializer === terminalExpression &&
        ts.isIdentifier(parent.name)
    ) {
        const variableType = checker.getTypeAtLocation(parent.name);

        if (variableType.aliasSymbol === contract.symbol) {
            return;
        }

        contract.usages.push({
            path,
            requiredType: checker.getTypeAtLocation(terminalExpression),
        });

        return;
    }

    if (path.length === 0) {
        contract.isOpaque = true;

        return;
    }

    contract.usages.push({ path });
};

const getPropertyType = (type: ts.Type, propertyName: string, checker: ts.TypeChecker) => {
    const property = checker.getPropertyOfType(type, propertyName);

    if (property === undefined) {
        return undefined;
    }

    const declaration =
        property.valueDeclaration ?? property.declarations?.[0] ?? type.symbol?.valueDeclaration;

    return declaration === undefined
        ? undefined
        : checker.getTypeOfSymbolAtLocation(property, declaration);
};

const getTypesAtPath = (
    types: readonly ts.Type[],
    path: readonly string[],
    checker: ts.TypeChecker,
) => {
    let currentTypes = [...types];

    for (const propertyName of path) {
        currentTypes = currentTypes.flatMap(type => {
            const propertyType = getPropertyType(type, propertyName, checker);

            return propertyType === undefined ? [] : [propertyType];
        });

        if (currentTypes.length === 0) {
            return [];
        }
    }

    return currentTypes;
};

const isOptionalProperty = (property: ts.Symbol) =>
    (property.flags & ts.SymbolFlags.Optional) !== 0;

const areTypesCollectivelyAssignable = (
    sourceTypes: readonly ts.Type[],
    targetType: ts.Type,
    checker: ts.TypeChecker,
    visitedTypes = new Set<ts.Type>(),
): boolean => {
    if (
        (targetType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0 ||
        sourceTypes.some(sourceType => checker.isTypeAssignableTo(sourceType, targetType))
    ) {
        return true;
    }

    if (visitedTypes.has(targetType)) {
        return true;
    }

    visitedTypes.add(targetType);

    if (targetType.isIntersection()) {
        return targetType.types.every(intersectionType =>
            areTypesCollectivelyAssignable(
                sourceTypes,
                intersectionType,
                checker,
                new Set(visitedTypes),
            ),
        );
    }

    if (targetType.isUnion()) {
        return targetType.types.some(unionType =>
            areTypesCollectivelyAssignable(sourceTypes, unionType, checker, new Set(visitedTypes)),
        );
    }

    if (
        checker.getSignaturesOfType(targetType, ts.SignatureKind.Call).length > 0 ||
        checker.getSignaturesOfType(targetType, ts.SignatureKind.Construct).length > 0 ||
        checker.getIndexInfosOfType(targetType).length > 0
    ) {
        return false;
    }

    return checker.getPropertiesOfType(targetType).every(targetProperty => {
        const sourcePropertyTypes = sourceTypes.flatMap(sourceType => {
            const sourcePropertyType = getPropertyType(sourceType, targetProperty.name, checker);

            return sourcePropertyType === undefined ? [] : [sourcePropertyType];
        });

        if (sourcePropertyTypes.length === 0) {
            return isOptionalProperty(targetProperty);
        }

        const targetPropertyDeclaration =
            targetProperty.valueDeclaration ??
            targetProperty.declarations?.[0] ??
            targetType.symbol?.valueDeclaration;

        if (targetPropertyDeclaration === undefined) {
            return false;
        }

        const targetPropertyType = checker.getTypeOfSymbolAtLocation(
            targetProperty,
            targetPropertyDeclaration,
        );

        return areTypesCollectivelyAssignable(
            sourcePropertyTypes,
            targetPropertyType,
            checker,
            new Set(visitedTypes),
        );
    });
};

const isUsageSatisfied = (
    usage: ContractUsage,
    sourceTypes: readonly ts.Type[],
    checker: ts.TypeChecker,
) => {
    const typesAtPath = getTypesAtPath(sourceTypes, usage.path, checker);

    if (typesAtPath.length === 0) {
        return false;
    }

    return usage.requiredType === undefined
        ? true
        : areTypesCollectivelyAssignable(typesAtPath, usage.requiredType, checker);
};

const isCreateThunkCall = (node: ts.CallExpression) =>
    ts.isIdentifier(node.expression) && node.expression.text === 'createThunk';

const markContractsUsedByGenericCallsAsOpaque = (
    sourceFile: ts.SourceFile,
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract>,
    checker: ts.TypeChecker,
) => {
    const visitTypeNode = (node: ts.Node) => {
        if (ts.isTypeReferenceNode(node)) {
            const type = checker.getTypeFromTypeNode(node);
            const contract =
                type.aliasSymbol === undefined
                    ? undefined
                    : contractsBySymbol.get(type.aliasSymbol);

            if (contract !== undefined) {
                contract.isOpaque = true;
            }
        }

        ts.forEachChild(node, visitTypeNode);
    };

    const visitNode = (node: ts.Node) => {
        if (ts.isCallExpression(node) && !isCreateThunkCall(node)) {
            node.typeArguments?.forEach(visitTypeNode);
        }

        if (ts.isTypeReferenceNode(node)) {
            node.typeArguments?.forEach(visitTypeNode);
        }

        ts.forEachChild(node, visitNode);
    };

    ts.forEachChild(sourceFile, visitNode);
};

const getConfigContract = (
    createThunkCall: ts.CallExpression,
    propertyName: 'extra' | 'state',
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract>,
    checker: ts.TypeChecker,
) => {
    const configTypeNode = createThunkCall.typeArguments?.[2];

    if (configTypeNode === undefined || !ts.isTypeLiteralNode(configTypeNode)) {
        return undefined;
    }

    const property = configTypeNode.members.find(
        member =>
            ts.isPropertySignature(member) &&
            member.type !== undefined &&
            member.name.getText() === propertyName,
    );

    if (
        property === undefined ||
        !ts.isPropertySignature(property) ||
        property.type === undefined
    ) {
        return undefined;
    }

    const propertyType = checker.getTypeFromTypeNode(property.type);

    return propertyType.aliasSymbol === undefined
        ? undefined
        : contractsBySymbol.get(propertyType.aliasSymbol);
};

const getObjectBindingIdentifier = (parameter: ts.ParameterDeclaration, propertyName: string) => {
    if (!ts.isObjectBindingPattern(parameter.name)) {
        return undefined;
    }

    const binding = parameter.name.elements.find(
        element => (element.propertyName ?? element.name).getText() === propertyName,
    );

    return binding !== undefined && ts.isIdentifier(binding.name) ? binding.name : undefined;
};

const getDispatchedThunkRequirements = (action: ts.Expression, checker: ts.TypeChecker) => {
    const actionType = checker.getTypeAtLocation(action);

    return checker.getSignaturesOfType(actionType, ts.SignatureKind.Call).flatMap(signature => {
        const parameters = signature.getParameters();
        const getStateParameter = parameters[1];
        const extraParameter = parameters[2];
        const getStateType =
            getStateParameter === undefined
                ? undefined
                : checker.getTypeOfSymbolAtLocation(getStateParameter, action);
        const stateType = getStateType
            ? checker
                  .getSignaturesOfType(getStateType, ts.SignatureKind.Call)
                  .map(getStateSignature => getStateSignature.getReturnType())[0]
            : undefined;
        const extraType =
            extraParameter === undefined
                ? undefined
                : checker.getTypeOfSymbolAtLocation(extraParameter, action);

        return [{ extraType, stateType }];
    });
};

const addDispatchedThunkUsages = (
    sourceFile: ts.SourceFile,
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract>,
    checker: ts.TypeChecker,
) => {
    const visitNode = (node: ts.Node) => {
        if (!ts.isCallExpression(node) || !isCreateThunkCall(node)) {
            ts.forEachChild(node, visitNode);

            return;
        }

        const callback = node.arguments[1];
        const callbackFunction =
            callback !== undefined &&
            (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
                ? callback
                : undefined;
        const apiParameter =
            callbackFunction === undefined ? undefined : callbackFunction.parameters[1];
        const dispatchIdentifier =
            apiParameter === undefined
                ? undefined
                : getObjectBindingIdentifier(apiParameter, 'dispatch');
        const dispatchSymbol =
            dispatchIdentifier === undefined
                ? undefined
                : checker.getSymbolAtLocation(dispatchIdentifier);

        if (
            callbackFunction === undefined ||
            apiParameter === undefined ||
            dispatchSymbol === undefined
        ) {
            ts.forEachChild(node, visitNode);

            return;
        }

        const stateContract = getConfigContract(node, 'state', contractsBySymbol, checker);
        const depsContract = getConfigContract(node, 'extra', contractsBySymbol, checker);

        const visitCallbackNode = (callbackNode: ts.Node) => {
            if (
                ts.isCallExpression(callbackNode) &&
                ts.isIdentifier(callbackNode.expression) &&
                checker.getSymbolAtLocation(callbackNode.expression) === dispatchSymbol
            ) {
                const action = callbackNode.arguments[0];

                if (action !== undefined) {
                    for (const requirement of getDispatchedThunkRequirements(action, checker)) {
                        if (requirement.stateType !== undefined && stateContract !== undefined) {
                            stateContract.usages.push({
                                path: [],
                                requiredType: requirement.stateType,
                            });
                        }

                        if (requirement.extraType !== undefined && depsContract !== undefined) {
                            depsContract.usages.push({
                                path: [],
                                requiredType: requirement.extraType,
                            });
                        }
                    }
                }
            }

            ts.forEachChild(callbackNode, visitCallbackNode);
        };

        ts.forEachChild(callbackFunction.body, visitCallbackNode);
        ts.forEachChild(node, visitNode);
    };

    ts.forEachChild(sourceFile, visitNode);
};

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
                    const sourceValue = node.source.value;

                    if (typeof sourceValue === 'string' && packageNames.includes(sourceValue)) {
                        node.specifiers.forEach(specifier => {
                            if (
                                specifier.type === 'ImportSpecifier' ||
                                specifier.type === 'ImportDefaultSpecifier'
                            ) {
                                let components = importedComponents.get(sourceValue);

                                if (components === undefined) {
                                    components = new Set<string>();
                                    importedComponents.set(sourceValue, components);
                                }

                                components.add(specifier.local.name);
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
    'no-unused-intersection-members': {
        meta: {
            type: 'suggestion',
            docs: {
                description:
                    'Reports State and Deps intersection members that are not required by their local implementation.',
                category: 'Best Practices',
                recommended: false,
            },
            messages: {
                unusedIntersectionMember:
                    "'{{memberName}}' is not required by the implementation using '{{typeName}}'. Remove it from the intersection.",
            },
            schema: [],
        },
        create(context) {
            const parserServices = context.sourceCode.parserServices as TypeAwareParserServices;

            if (
                parserServices.program === undefined ||
                parserServices.esTreeNodeToTSNodeMap === undefined ||
                parserServices.tsNodeToESTreeNodeMap === undefined
            ) {
                return {};
            }

            const checker = parserServices.program.getTypeChecker();

            return {
                'Program:exit': programNode => {
                    const sourceFile = parserServices.esTreeNodeToTSNodeMap?.get(
                        programNode as Rule.Node,
                    );

                    if (sourceFile === undefined || !ts.isSourceFile(sourceFile)) {
                        return;
                    }

                    const contractsBySymbol = new Map<ts.Symbol, IntersectionContract>();

                    for (const statement of sourceFile.statements) {
                        if (
                            !ts.isTypeAliasDeclaration(statement) ||
                            !ts.isIntersectionTypeNode(statement.type) ||
                            !contractTypeNamePattern.test(statement.name.text)
                        ) {
                            continue;
                        }

                        const symbol = checker.getSymbolAtLocation(statement.name);

                        if (symbol === undefined) {
                            continue;
                        }

                        contractsBySymbol.set(symbol, {
                            isOpaque: false,
                            members: statement.type.types.map(memberNode => ({
                                name: memberNode.getText(sourceFile),
                                node: memberNode,
                                type: checker.getTypeFromTypeNode(memberNode),
                            })),
                            name: statement.name.text,
                            symbol,
                            usages: [],
                        });
                    }

                    if (contractsBySymbol.size === 0) {
                        return;
                    }

                    markContractsUsedByGenericCallsAsOpaque(sourceFile, contractsBySymbol, checker);
                    addDispatchedThunkUsages(sourceFile, contractsBySymbol, checker);

                    const visitNode = (node: ts.Node) => {
                        if (
                            ts.isExpression(node) &&
                            !isNodeDeclarationName(node) &&
                            !isInsideTypeNode(node)
                        ) {
                            const contract = getAliasedContract(node, contractsBySymbol, checker);

                            if (contract !== undefined) {
                                addContractUsage(node, contract, checker);
                            }
                        }

                        ts.forEachChild(node, visitNode);
                    };

                    ts.forEachChild(sourceFile, visitNode);

                    for (const contract of contractsBySymbol.values()) {
                        if (contract.isOpaque || contract.usages.length === 0) {
                            continue;
                        }

                        contract.members.forEach((member, memberIndex) => {
                            const remainingTypes = contract.members
                                .filter((_, index) => index !== memberIndex)
                                .map(remainingMember => remainingMember.type);
                            const isMemberUsed = contract.usages.some(
                                usage =>
                                    isUsageSatisfied(usage, [member.type], checker) ||
                                    !isUsageSatisfied(usage, remainingTypes, checker),
                            );

                            if (isMemberUsed) return;

                            const reportNode = parserServices.tsNodeToESTreeNodeMap?.get(
                                member.node,
                            );

                            if (reportNode === undefined) {
                                return;
                            }

                            context.report({
                                node: reportNode,
                                messageId: 'unusedIntersectionMember',
                                data: {
                                    memberName: member.name,
                                    typeName: contract.name,
                                },
                            });
                        });
                    }
                },
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
                    "Invalid domain '{{domain}}'. Allowed: accounts, app, coin, dashboard, device, feedback, firmware, guide, menu, passphrase, promo, receive, send, settings, staking, trading, transaction, wallet-connect.",
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
                'feedback',
                'firmware',
                'guide',
                'menu',
                'onboarding',
                'passphrase',
                'promo',
                'receive',
                'send',
                'settings',
                'staking',
                'yield',
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
                if (domain === undefined) {
                    return { messageId: 'invalidFormat' };
                }

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
