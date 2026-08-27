import type { Rule } from 'eslint';
import ts from 'typescript';

// This rule proves that a member is removable instead of trying to reconstruct complete data flow.
// It records concrete requirements, marks ambiguous escapes as opaque, and reports only when every
// requirement remains satisfied without the member. See `README.md` for the full design.

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
    // A usage is represented by the accessed property path and, when the value is passed on, the
    // type expected by the receiver. Transparent wrappers do not change either requirement.
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

            // A runtime key can reach any part of the contract, so no member is provably unused.
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
            // A value passed to an unresolved signature may depend on the complete contract.
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
        // A bare value can escape this file without exposing which parts the receiver needs.
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

// Different intersection members can collectively satisfy a target even when none is assignable
// on its own. Compare their properties recursively to account for requirements split across members.
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
        // Recursive target types are treated as satisfied to prefer a false negative over an
        // incorrect removal suggestion.
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
        // Callable, constructable, and indexed contracts cannot be safely composed property by
        // property. Failing this proof keeps the member under inspection.
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

// Generic consumers may use a contract through constraints or inference without an observable
// property path. createThunk is excluded because its state and extra contracts are handled below.
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

// A dispatched child thunk introduces transitive state and dependency requirements even though the
// parent callback never accesses those values directly.
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

/**
 * Reports confidently unused members of local State and Deps intersection contracts.
 * See `README.md` for the analysis principles and conservative fallbacks.
 */
export const noUnusedIntersectionMembersRule: Rule.RuleModule = {
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

                // Restricting candidates to direct aliases with explicit intersections keeps each
                // proof tied to a concrete member list that can be reported and edited reliably.
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

                // Record ambiguous escapes and hidden child-thunk requirements before evaluating
                // ordinary expression and property-path usages.
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
                        // Keep overlapping providers instead of choosing one arbitrarily. Otherwise,
                        // a member is necessary when removing it leaves any usage unsatisfied.
                        const isMemberUsed = contract.usages.some(
                            usage =>
                                isUsageSatisfied(usage, [member.type], checker) ||
                                !isUsageSatisfied(usage, remainingTypes, checker),
                        );

                        if (isMemberUsed) return;

                        const reportNode = parserServices.tsNodeToESTreeNodeMap?.get(member.node);

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
};
