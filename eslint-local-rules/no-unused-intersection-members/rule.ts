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
    rootPath: string[];
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

const getAliasedContracts = (
    node: ts.Expression,
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract[]>,
    checker: ts.TypeChecker,
) => {
    const type = checker.getTypeAtLocation(node);

    return type.aliasSymbol === undefined ? [] : (contractsBySymbol.get(type.aliasSymbol) ?? []);
};

const doesPathStartWith = (path: readonly string[], prefix: readonly string[]) =>
    prefix.every((part, index) => path[index] === part);

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

const getTypeAtPath = (type: ts.Type, path: readonly string[], checker: ts.TypeChecker) => {
    let currentType: ts.Type | undefined = type;

    for (const propertyName of path) {
        currentType = getPropertyType(currentType, propertyName, checker);

        if (currentType === undefined) {
            return undefined;
        }
    }

    return currentType;
};

const normalizeContractUsage = (
    usage: ContractUsage,
    contract: IntersectionContract,
    checker: ts.TypeChecker,
): ContractUsage | undefined => {
    if (doesPathStartWith(usage.path, contract.rootPath)) {
        return {
            path: usage.path.slice(contract.rootPath.length),
            requiredType: usage.requiredType,
        };
    }

    if (!doesPathStartWith(contract.rootPath, usage.path)) {
        return undefined;
    }

    const remainingRootPath = contract.rootPath.slice(usage.path.length);
    const { requiredType } = usage;

    if (requiredType === undefined) {
        return undefined;
    }

    if ((requiredType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0) {
        // An untyped receiver could inspect any nested capability, so keep every member.
        return { path: [], requiredType };
    }

    const requiredTypeAtRoot = getTypeAtPath(requiredType, remainingRootPath, checker);

    return requiredTypeAtRoot === undefined
        ? undefined
        : { path: [], requiredType: requiredTypeAtRoot };
};

const recordContractUsage = (
    usage: ContractUsage,
    contract: IntersectionContract,
    checker: ts.TypeChecker,
) => {
    const normalizedUsage = normalizeContractUsage(usage, contract, checker);

    if (normalizedUsage !== undefined) {
        contract.usages.push(normalizedUsage);
    }
};

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

            // A runtime key can reach any part below its current path. It makes this contract
            // opaque only when that path contains, or could still reach, the contract root.
            if (
                doesPathStartWith(path, contract.rootPath) ||
                doesPathStartWith(contract.rootPath, path)
            ) {
                contract.isOpaque = true;
            }

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

        recordContractUsage({ path, requiredType }, contract, checker);

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

        recordContractUsage(
            {
                path,
                requiredType: checker.getTypeAtLocation(terminalExpression),
            },
            contract,
            checker,
        );

        return;
    }

    if (path.length === 0) {
        // A bare value can escape this file without exposing which parts the receiver needs.
        contract.isOpaque = true;

        return;
    }

    recordContractUsage({ path }, contract, checker);
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
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract[]>,
    checker: ts.TypeChecker,
) => {
    const visitTypeNode = (node: ts.Node) => {
        if (ts.isTypeReferenceNode(node)) {
            const type = checker.getTypeFromTypeNode(node);
            const contracts =
                type.aliasSymbol === undefined
                    ? []
                    : (contractsBySymbol.get(type.aliasSymbol) ?? []);

            for (const contract of contracts) {
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

const getConfigContracts = (
    createThunkCall: ts.CallExpression,
    propertyName: 'extra' | 'state',
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract[]>,
    checker: ts.TypeChecker,
) => {
    const configTypeNode = createThunkCall.typeArguments?.[2];

    if (configTypeNode === undefined || !ts.isTypeLiteralNode(configTypeNode)) {
        return [];
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
        return [];
    }

    const propertyType = checker.getTypeFromTypeNode(property.type);

    return propertyType.aliasSymbol === undefined
        ? []
        : (contractsBySymbol.get(propertyType.aliasSymbol) ?? []);
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

const getContractsForType = (
    type: ts.Type | undefined,
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract[]>,
) => (type?.aliasSymbol === undefined ? [] : (contractsBySymbol.get(type.aliasSymbol) ?? []));

const addRequirementsFromDispatches = (
    body: ts.Node,
    dispatchSymbol: ts.Symbol,
    stateContracts: readonly IntersectionContract[],
    depsContracts: readonly IntersectionContract[],
    checker: ts.TypeChecker,
) => {
    const visitNode = (node: ts.Node) => {
        if (
            ts.isCallExpression(node) &&
            ts.isIdentifier(node.expression) &&
            checker.getSymbolAtLocation(node.expression) === dispatchSymbol
        ) {
            const action = node.arguments[0];

            if (action !== undefined) {
                for (const requirement of getDispatchedThunkRequirements(action, checker)) {
                    if (requirement.stateType !== undefined) {
                        for (const stateContract of stateContracts) {
                            recordContractUsage(
                                { path: [], requiredType: requirement.stateType },
                                stateContract,
                                checker,
                            );
                        }
                    }

                    if (requirement.extraType !== undefined) {
                        for (const depsContract of depsContracts) {
                            recordContractUsage(
                                { path: [], requiredType: requirement.extraType },
                                depsContract,
                                checker,
                            );
                        }
                    }
                }
            }
        }

        ts.forEachChild(node, visitNode);
    };

    ts.forEachChild(body, visitNode);
};

const addVanillaThunkUsages = (
    node: ts.FunctionLikeDeclaration,
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract[]>,
    checker: ts.TypeChecker,
) => {
    const dispatchParameter = node.parameters[0];
    const getStateParameter = node.parameters[1];
    const extraParameter = node.parameters[2];

    if (
        node.body === undefined ||
        dispatchParameter === undefined ||
        !ts.isIdentifier(dispatchParameter.name)
    ) {
        return;
    }

    const dispatchSymbol = checker.getSymbolAtLocation(dispatchParameter.name);

    if (dispatchSymbol === undefined) {
        return;
    }

    const getStateType =
        getStateParameter === undefined
            ? undefined
            : checker.getTypeAtLocation(getStateParameter.name);
    const stateType = getStateType
        ? checker
              .getSignaturesOfType(getStateType, ts.SignatureKind.Call)
              .map(signature => signature.getReturnType())[0]
        : undefined;
    const extraType =
        extraParameter === undefined ? undefined : checker.getTypeAtLocation(extraParameter.name);
    const stateContracts = getContractsForType(stateType, contractsBySymbol);
    const depsContracts = getContractsForType(extraType, contractsBySymbol);

    if (stateContracts.length === 0 && depsContracts.length === 0) {
        return;
    }

    addRequirementsFromDispatches(
        node.body,
        dispatchSymbol,
        stateContracts,
        depsContracts,
        checker,
    );
};

// A dispatched child thunk introduces transitive state and dependency requirements even though the
// parent callback never accesses those values directly.
const addDispatchedThunkUsages = (
    sourceFile: ts.SourceFile,
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract[]>,
    checker: ts.TypeChecker,
) => {
    const visitNode = (node: ts.Node) => {
        if (ts.isFunctionLike(node)) {
            addVanillaThunkUsages(node, contractsBySymbol, checker);
        }

        if (ts.isCallExpression(node) && isCreateThunkCall(node)) {
            const callback = node.arguments[1];
            const callbackFunction =
                callback !== undefined &&
                (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
                    ? callback
                    : undefined;
            const apiParameter = callbackFunction?.parameters[1];
            const dispatchIdentifier =
                apiParameter === undefined
                    ? undefined
                    : getObjectBindingIdentifier(apiParameter, 'dispatch');
            const dispatchSymbol =
                dispatchIdentifier === undefined
                    ? undefined
                    : checker.getSymbolAtLocation(dispatchIdentifier);

            if (callbackFunction !== undefined && dispatchSymbol !== undefined) {
                addRequirementsFromDispatches(
                    callbackFunction.body,
                    dispatchSymbol,
                    getConfigContracts(node, 'state', contractsBySymbol, checker),
                    getConfigContracts(node, 'extra', contractsBySymbol, checker),
                    checker,
                );
            }
        }

        ts.forEachChild(node, visitNode);
    };

    ts.forEachChild(sourceFile, visitNode);
};

const getWrappedServicesIntersection = (node: ts.TypeNode, checker: ts.TypeChecker) => {
    if (
        !ts.isTypeReferenceNode(node) ||
        node.typeArguments?.length !== 1 ||
        !ts.isIntersectionTypeNode(node.typeArguments[0])
    ) {
        return undefined;
    }

    const servicesIntersection = node.typeArguments[0];
    const wrapperType = checker.getTypeFromTypeNode(node);
    const wrapperProperties = checker.getPropertiesOfType(wrapperType);

    if (wrapperProperties.length !== 1 || wrapperProperties[0].name !== 'services') {
        return undefined;
    }

    const wrappedServicesType = getPropertyType(wrapperType, 'services', checker);
    const intersectionType = checker.getTypeFromTypeNode(servicesIntersection);

    if (
        wrappedServicesType === undefined ||
        !checker.isTypeAssignableTo(wrappedServicesType, intersectionType) ||
        !checker.isTypeAssignableTo(intersectionType, wrappedServicesType)
    ) {
        return undefined;
    }

    return servicesIntersection;
};

const getWrappedServicesIntersections = (node: ts.TypeNode, checker: ts.TypeChecker) => {
    const possibleWrappers = ts.isIntersectionTypeNode(node) ? node.types : [node];

    return possibleWrappers.flatMap(possibleWrapper => {
        const servicesIntersection = getWrappedServicesIntersection(possibleWrapper, checker);

        return servicesIntersection === undefined ? [] : [servicesIntersection];
    });
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

                const contractsBySymbol = new Map<ts.Symbol, IntersectionContract[]>();

                for (const statement of sourceFile.statements) {
                    if (
                        !ts.isTypeAliasDeclaration(statement) ||
                        !contractTypeNamePattern.test(statement.name.text)
                    ) {
                        continue;
                    }

                    const symbol = checker.getSymbolAtLocation(statement.name);

                    if (symbol === undefined) {
                        continue;
                    }

                    const contracts: IntersectionContract[] = [];

                    // Direct intersections remain independently editable top-level members.
                    if (ts.isIntersectionTypeNode(statement.type)) {
                        contracts.push({
                            isOpaque: false,
                            members: statement.type.types.map(memberNode => ({
                                name: memberNode.getText(sourceFile),
                                node: memberNode,
                                type: checker.getTypeFromTypeNode(memberNode),
                            })),
                            name: statement.name.text,
                            rootPath: [],
                            symbol,
                            usages: [],
                        });
                    }

                    const wrappedServicesIntersections = getWrappedServicesIntersections(
                        statement.type,
                        checker,
                    );
                    const wrappedServiceMembers = wrappedServicesIntersections.flatMap(
                        intersection => intersection.types,
                    );

                    if (wrappedServiceMembers.length > 0) {
                        // WithServices moves a dependency intersection below the `services` key.
                        // Analyze those inner members as another local contract while retaining the
                        // outer contract above for any non-service intersection members.
                        contracts.push({
                            isOpaque: false,
                            members: wrappedServiceMembers.map(memberNode => ({
                                name: memberNode.getText(sourceFile),
                                node: memberNode,
                                type: checker.getTypeFromTypeNode(memberNode),
                            })),
                            name: statement.name.text,
                            rootPath: ['services'],
                            symbol,
                            usages: [],
                        });
                    }

                    if (contracts.length > 0) {
                        contractsBySymbol.set(symbol, contracts);
                    }
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
                        const contracts = getAliasedContracts(node, contractsBySymbol, checker);

                        for (const contract of contracts) {
                            addContractUsage(node, contract, checker);
                        }
                    }

                    ts.forEachChild(node, visitNode);
                };

                ts.forEachChild(sourceFile, visitNode);

                for (const contract of [...contractsBySymbol.values()].flat()) {
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
