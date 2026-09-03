import type { Rule } from 'eslint';
import ts from 'typescript';

import { createTypeScriptNodeReporter, getTypeScriptParserServices } from '../utils';

// This rule proves that a member is removable instead of trying to reconstruct complete data flow.
// It records concrete requirements, marks ambiguous escapes as opaque, and reports only when every
// requirement remains satisfied without the member. See `README.md` for the full design.

type IntersectionMember = {
    name: string;
    node: ts.TypeNode;
    type: ts.Type;
};

type ContractUsage = {
    path: string[];
    requiredType?: ts.Type;
};

type IntersectionGroup = {
    members: IntersectionMember[];
    path: string[];
};

type ContractProperty = {
    name: string;
    node: ts.PropertySignature;
};

type PropertyGroup = {
    members: ContractProperty[];
    path: string[];
};

type IntersectionContract = {
    groups: IntersectionGroup[];
    isOpaque: boolean;
    name: string;
    propertyGroups: PropertyGroup[];
    rootPath: string[];
    symbol: ts.Symbol;
    usages: ContractUsage[];
};

type RuleOptions = {
    additionalTypeNameSuffixes?: string[];
};

const defaultTypeNameSuffixes = ['State', 'Deps'];

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

const hasAncestorInSet = (node: ts.Node, ancestors: ReadonlySet<ts.Node>) => {
    let currentNode: ts.Node | undefined = node.parent;

    while (currentNode !== undefined) {
        if (ancestors.has(currentNode)) {
            return true;
        }

        currentNode = currentNode.parent;
    }

    return false;
};

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

const getBindingPropertyName = (name: ts.PropertyName | ts.BindingName) => {
    if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
        return name.text;
    }

    if (
        ts.isComputedPropertyName(name) &&
        (ts.isStringLiteralLike(name.expression) || ts.isNumericLiteral(name.expression))
    ) {
        return name.expression.text;
    }

    return undefined;
};

const addBindingPatternUsages = (
    pattern: ts.ObjectBindingPattern,
    contract: IntersectionContract,
    checker: ts.TypeChecker,
    parentPath: readonly string[] = [],
) => {
    if (pattern.elements.length === 0 && parentPath.length > 0) {
        recordContractUsage({ path: [...parentPath] }, contract, checker);

        return;
    }

    for (const element of pattern.elements) {
        if (element.dotDotDotToken !== undefined) {
            // A rest binding can read every property not explicitly destructured.
            contract.isOpaque = true;

            return;
        }

        const propertyName = getBindingPropertyName(element.propertyName ?? element.name);

        if (propertyName === undefined || ts.isArrayBindingPattern(element.name)) {
            contract.isOpaque = true;

            return;
        }

        const path = [...parentPath, propertyName];

        if (ts.isObjectBindingPattern(element.name)) {
            addBindingPatternUsages(element.name, contract, checker, path);
        } else {
            recordContractUsage({ path }, contract, checker);
        }
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
        ts.isObjectBindingPattern(parent.name)
    ) {
        addBindingPatternUsages(parent.name, contract, checker, path);

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

const isPathPrefix = (prefix: readonly string[], path: readonly string[]) =>
    prefix.every((part, index) => path[index] === part);

const getGroupUsages = (
    contract: IntersectionContract,
    group: { path: readonly string[] },
    checker: ts.TypeChecker,
) =>
    contract.usages.flatMap(usage => {
        if (isPathPrefix(group.path, usage.path)) {
            return [{ ...usage, path: usage.path.slice(group.path.length) }];
        }

        if (!isPathPrefix(usage.path, group.path)) {
            return [];
        }

        if (usage.requiredType === undefined) {
            // Accessing a parent value without a narrower expected type may consume every nested
            // member.
            return [{ path: [] }];
        }

        return getTypesAtPath(
            [usage.requiredType],
            group.path.slice(usage.path.length),
            checker,
        ).map(requiredType => ({ path: [], requiredType }));
    });

const isOptionalProperty = (property: ts.Symbol) =>
    (property.flags & ts.SymbolFlags.Optional) !== 0;

const isPropertyUsed = (
    property: ContractProperty,
    usages: readonly ContractUsage[],
    checker: ts.TypeChecker,
) =>
    usages.some(usage => {
        const [firstPathPart] = usage.path;

        if (firstPathPart !== undefined) {
            return firstPathPart === property.name;
        }

        if (usage.requiredType === undefined) {
            return true;
        }

        if (
            (usage.requiredType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0 ||
            checker.getIndexInfosOfType(usage.requiredType).length > 0
        ) {
            return true;
        }

        const requiredProperty = checker.getPropertyOfType(usage.requiredType, property.name);

        return requiredProperty !== undefined && !isOptionalProperty(requiredProperty);
    });

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

// Type-level consumers may depend on members without producing an observable runtime property path.
// Supported contract composition and thunk configuration remain transparent; derivation and generic
// contexts keep the source contract intact.
const markContractsUsedByOpaqueTypePositions = (
    sourceFile: ts.SourceFile,
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract[]>,
    checker: ts.TypeChecker,
) => {
    const supportedThunkConfigProperties = new Set<ts.Declaration>();
    const collectThunkConfigProperties = (node: ts.Node) => {
        if (ts.isCallExpression(node) && isCreateThunkCall(node)) {
            const configTypeNode = node.typeArguments?.[2];

            if (configTypeNode !== undefined) {
                const configType = checker.getTypeFromTypeNode(configTypeNode);

                for (const propertyName of ['state', 'extra']) {
                    checker
                        .getPropertyOfType(configType, propertyName)
                        ?.declarations?.forEach(declaration =>
                            supportedThunkConfigProperties.add(declaration),
                        );
                }
            }
        }

        ts.forEachChild(node, collectThunkConfigProperties);
    };
    ts.forEachChild(sourceFile, collectThunkConfigProperties);

    const isInsideSupportedThunkConfig = (node: ts.Node) => {
        let currentNode: ts.Node | undefined = node.parent;

        while (currentNode !== undefined && !ts.isStatement(currentNode)) {
            if (
                ts.isPropertySignature(currentNode) &&
                supportedThunkConfigProperties.has(currentNode)
            ) {
                return true;
            }

            currentNode = currentNode.parent;
        }

        return false;
    };

    const isOpaqueTypePosition = (node: ts.TypeReferenceNode) => {
        if (isInsideSupportedThunkConfig(node)) {
            return false;
        }

        let currentNode: ts.Node = node;
        let { parent }: { parent: ts.Node | undefined } = node;

        while (parent !== undefined && !ts.isStatement(parent)) {
            if (
                ts.isTypeOperatorNode(parent) ||
                ts.isIndexedAccessTypeNode(parent) ||
                ts.isConditionalTypeNode(parent) ||
                ts.isMappedTypeNode(parent)
            ) {
                return true;
            }

            if (
                (ts.isTypeReferenceNode(parent) || ts.isCallExpression(parent)) &&
                parent.typeArguments?.includes(currentNode as ts.TypeNode)
            ) {
                return true;
            }

            if (ts.isTypeAliasDeclaration(parent)) {
                const containingSymbol = checker.getSymbolAtLocation(parent.name);

                return containingSymbol === undefined || !contractsBySymbol.has(containingSymbol);
            }

            if (ts.isParameter(parent) || ts.isVariableDeclaration(parent)) {
                return false;
            }

            currentNode = parent;
            parent = currentNode.parent;
        }

        return ts.isInterfaceDeclaration(parent);
    };

    const visitNode = (node: ts.Node) => {
        if (ts.isTypeReferenceNode(node)) {
            const type = checker.getTypeFromTypeNode(node);
            const contracts =
                type.aliasSymbol === undefined
                    ? []
                    : (contractsBySymbol.get(type.aliasSymbol) ?? []);

            if (isOpaqueTypePosition(node)) {
                for (const contract of contracts) {
                    contract.isOpaque = true;
                }
            }
        }

        ts.forEachChild(node, visitNode);
    };

    ts.forEachChild(sourceFile, visitNode);
};

const getConfigPropertyType = (
    createThunkCall: ts.CallExpression,
    propertyName: 'extra' | 'state',
    checker: ts.TypeChecker,
) => {
    const configTypeNode = createThunkCall.typeArguments?.[2];

    if (configTypeNode === undefined) {
        return undefined;
    }

    const configType = checker.getTypeFromTypeNode(configTypeNode);
    const property = checker.getPropertyOfType(configType, propertyName);

    if (property === undefined) {
        return undefined;
    }

    const declaration = property.valueDeclaration ?? property.declarations?.[0] ?? configTypeNode;

    return checker.getTypeOfSymbolAtLocation(property, declaration);
};

const getConfigContracts = (
    createThunkCall: ts.CallExpression,
    propertyName: 'extra' | 'state',
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract[]>,
    checker: ts.TypeChecker,
) => {
    const propertyType = getConfigPropertyType(createThunkCall, propertyName, checker);

    return propertyType?.aliasSymbol === undefined
        ? []
        : (contractsBySymbol.get(propertyType.aliasSymbol) ?? []);
};

const collectIntersectionGroups = (
    node: ts.TypeNode,
    sourceFile: ts.SourceFile,
    checker: ts.TypeChecker,
    path: readonly string[] = [],
): IntersectionGroup[] => {
    if (ts.isIntersectionTypeNode(node)) {
        const group = {
            members: node.types.map(memberNode => ({
                name: memberNode.getText(sourceFile),
                node: memberNode,
                type: checker.getTypeFromTypeNode(memberNode),
            })),
            path: [...path],
        };
        const nestedGroups = node.types.flatMap(memberNode =>
            ts.isTypeLiteralNode(memberNode)
                ? collectIntersectionGroups(memberNode, sourceFile, checker, path)
                : [],
        );

        return [group, ...nestedGroups];
    }

    if (!ts.isTypeLiteralNode(node)) {
        return [];
    }

    return node.members.flatMap(member => {
        if (!ts.isPropertySignature(member) || member.type === undefined) {
            return [];
        }

        const propertyName = getBindingPropertyName(member.name);

        return propertyName === undefined
            ? []
            : collectIntersectionGroups(member.type, sourceFile, checker, [...path, propertyName]);
    });
};

const collectPropertyGroups = (
    node: ts.TypeNode,
    path: readonly string[] = [],
): PropertyGroup[] => {
    if (ts.isIntersectionTypeNode(node)) {
        return node.types.flatMap(memberNode => collectPropertyGroups(memberNode, path));
    }

    if (!ts.isTypeLiteralNode(node)) {
        return [];
    }

    const members = node.members.flatMap(member => {
        if (!ts.isPropertySignature(member) || member.type === undefined) {
            return [];
        }

        const propertyName = getBindingPropertyName(member.name);

        return propertyName === undefined
            ? []
            : [
                  {
                      name: propertyName,
                      node: member,
                  },
              ];
    });
    const nestedGroups = node.members.flatMap(member => {
        if (!ts.isPropertySignature(member) || member.type === undefined) {
            return [];
        }

        const propertyName = getBindingPropertyName(member.name);

        return propertyName === undefined
            ? []
            : collectPropertyGroups(member.type, [...path, propertyName]);
    });

    return members.length === 0 ? nestedGroups : [{ members, path: [...path] }, ...nestedGroups];
};

const getDependencyFactoryFunction = (node: ts.Node) => {
    if (
        ts.isFunctionDeclaration(node) &&
        node.name !== undefined &&
        /^create[A-Z]/.test(node.name.text)
    ) {
        return node;
    }

    if (
        (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
        ts.isVariableDeclaration(node.parent) &&
        ts.isIdentifier(node.parent.name) &&
        /^create[A-Z]/.test(node.parent.name.text)
    ) {
        return node;
    }

    return undefined;
};

const collectRoleContractSymbols = (sourceFile: ts.SourceFile, checker: ts.TypeChecker) => {
    const symbols = new Set<ts.Symbol>();
    const addTypeAliasSymbol = (type: ts.Type | undefined) => {
        if (type?.aliasSymbol !== undefined) {
            symbols.add(type.aliasSymbol);
        }
    };
    const visitNode = (node: ts.Node) => {
        if (ts.isCallExpression(node) && isCreateThunkCall(node)) {
            addTypeAliasSymbol(getConfigPropertyType(node, 'state', checker));
            addTypeAliasSymbol(getConfigPropertyType(node, 'extra', checker));
        }

        const dependencyFactory = getDependencyFactoryFunction(node);
        const depsParameter = dependencyFactory?.parameters[0];

        if (
            depsParameter !== undefined &&
            ts.isIdentifier(depsParameter.name) &&
            depsParameter.name.text === 'deps'
        ) {
            addTypeAliasSymbol(
                depsParameter.type === undefined
                    ? checker.getTypeAtLocation(depsParameter)
                    : checker.getTypeFromTypeNode(depsParameter.type),
            );
        }

        ts.forEachChild(node, visitNode);
    };

    ts.forEachChild(sourceFile, visitNode);

    return symbols;
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

const getDispatchSymbol = (parameter: ts.ParameterDeclaration, checker: ts.TypeChecker) => {
    const bindingIdentifier = getObjectBindingIdentifier(parameter, 'dispatch');

    if (bindingIdentifier !== undefined) {
        return checker.getSymbolAtLocation(bindingIdentifier);
    }

    if (!ts.isIdentifier(parameter.name)) {
        return undefined;
    }

    return checker.getPropertyOfType(checker.getTypeAtLocation(parameter.name), 'dispatch');
};

const getCalledSymbol = (expression: ts.LeftHandSideExpression, checker: ts.TypeChecker) => {
    if (ts.isIdentifier(expression)) {
        return checker.getSymbolAtLocation(expression);
    }

    if (ts.isPropertyAccessExpression(expression)) {
        return checker.getSymbolAtLocation(expression.name);
    }

    return undefined;
};

const getThunkActionRequirements = (
    actionType: ts.Type,
    location: ts.Node,
    checker: ts.TypeChecker,
) =>
    checker.getSignaturesOfType(actionType, ts.SignatureKind.Call).flatMap(signature => {
        const parameters = signature.getParameters();
        const getStateParameter = parameters[1];
        const extraParameter = parameters[2];
        const getStateType =
            getStateParameter === undefined
                ? undefined
                : checker.getTypeOfSymbolAtLocation(getStateParameter, location);
        const stateType = getStateType
            ? checker
                  .getSignaturesOfType(getStateType, ts.SignatureKind.Call)
                  .map(getStateSignature => getStateSignature.getReturnType())[0]
            : undefined;
        const extraType =
            extraParameter === undefined
                ? undefined
                : checker.getTypeOfSymbolAtLocation(extraParameter, location);

        return [{ extraType, stateType }];
    });

const getDispatchedThunkRequirements = (action: ts.Expression, checker: ts.TypeChecker) =>
    getThunkActionRequirements(checker.getTypeAtLocation(action), action, checker);

const getContextualShorthandType = (node: ts.Identifier, checker: ts.TypeChecker) => {
    const shorthand = node.parent;

    if (!ts.isShorthandPropertyAssignment(shorthand)) {
        return undefined;
    }

    const objectLiteral = shorthand.parent;

    if (!ts.isObjectLiteralExpression(objectLiteral)) {
        return undefined;
    }

    const contextualType =
        checker.getContextualType(objectLiteral) ??
        (ts.isCallExpression(objectLiteral.parent) &&
        objectLiteral.parent.arguments.includes(objectLiteral)
            ? getExpectedArgumentType(objectLiteral.parent, objectLiteral, checker)
            : undefined);
    const property =
        contextualType === undefined
            ? undefined
            : checker.getPropertyOfType(contextualType, shorthand.name.text);

    return property === undefined
        ? undefined
        : checker.getTypeOfSymbolAtLocation(property, shorthand);
};

const getContractsForType = (
    type: ts.Type | undefined,
    contractsBySymbol: ReadonlyMap<ts.Symbol, IntersectionContract[]>,
) => (type?.aliasSymbol === undefined ? [] : (contractsBySymbol.get(type.aliasSymbol) ?? []));

const getDispatchTypeRequirements = (
    dispatchType: ts.Type,
    location: ts.Node,
    checker: ts.TypeChecker,
) =>
    checker.getSignaturesOfType(dispatchType, ts.SignatureKind.Call).flatMap(signature => {
        const actionParameter = signature.getParameters()[0];

        if (actionParameter === undefined) {
            return [];
        }

        const actionType = checker.getTypeOfSymbolAtLocation(actionParameter, location);

        return getThunkActionRequirements(actionType, location, checker);
    });

const addRequirementsFromDispatches = (
    body: ts.Node,
    dispatchSymbol: ts.Symbol,
    stateContracts: readonly IntersectionContract[],
    depsContracts: readonly IntersectionContract[],
    checker: ts.TypeChecker,
) => {
    const addRequirements = (requirements: ReturnType<typeof getDispatchedThunkRequirements>) => {
        for (const requirement of requirements) {
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
    };
    const visitNode = (node: ts.Node) => {
        if (
            ts.isCallExpression(node) &&
            getCalledSymbol(node.expression, checker) === dispatchSymbol
        ) {
            const action = node.arguments[0];

            if (action !== undefined) {
                addRequirements(getDispatchedThunkRequirements(action, checker));
            }
        }

        if (
            ts.isIdentifier(node) &&
            (ts.isShorthandPropertyAssignment(node.parent)
                ? checker.getShorthandAssignmentValueSymbol(node.parent)
                : checker.getSymbolAtLocation(node)) === dispatchSymbol
        ) {
            const contextualDispatchType = getContextualShorthandType(node, checker);

            if (contextualDispatchType !== undefined) {
                addRequirements(getDispatchTypeRequirements(contextualDispatchType, node, checker));
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
            const dispatchSymbol =
                apiParameter === undefined ? undefined : getDispatchSymbol(apiParameter, checker);

            if (
                callbackFunction?.body !== undefined &&
                apiParameter !== undefined &&
                dispatchSymbol !== undefined
            ) {
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
 * Reports confidently unused members of recognized local contracts.
 * See `README.md` for the analysis principles and conservative fallbacks.
 */
export const noUnusedIntersectionMembersRule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Reports contract members that are not required by their local implementation.',
            category: 'Best Practices',
            recommended: false,
        },
        messages: {
            unusedContractMember:
                "'{{memberName}}' is not required by the implementation using '{{typeName}}'. Remove it from the contract.",
            unusedIntersectionMember:
                "'{{memberName}}' is not required by the implementation using '{{typeName}}'. Remove it from the intersection.",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    additionalTypeNameSuffixes: {
                        type: 'array',
                        items: { type: 'string', minLength: 1 },
                        uniqueItems: true,
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    create(context) {
        const parserServices = getTypeScriptParserServices(context);

        if (parserServices === undefined) {
            return {};
        }

        const checker = parserServices.program.getTypeChecker();
        const report = createTypeScriptNodeReporter(context, parserServices);
        const options = context.options[0] as RuleOptions | undefined;
        const typeNameSuffixes = [
            ...defaultTypeNameSuffixes,
            ...(options?.additionalTypeNameSuffixes ?? []),
        ];

        return {
            'Program:exit': programNode => {
                const sourceFile = parserServices.getTypeScriptNode(programNode as Rule.Node);

                if (sourceFile === undefined || !ts.isSourceFile(sourceFile)) {
                    return;
                }

                const contractsBySymbol = new Map<ts.Symbol, IntersectionContract[]>();
                const roleContractSymbols = collectRoleContractSymbols(sourceFile, checker);

                // Restrict candidates to local aliases with explicit intersections so each proof is
                // tied to a concrete member list that can be reported and edited reliably.
                for (const statement of sourceFile.statements) {
                    if (!ts.isTypeAliasDeclaration(statement)) {
                        continue;
                    }

                    const symbol = checker.getSymbolAtLocation(statement.name);

                    if (
                        symbol === undefined ||
                        (!typeNameSuffixes.some(suffix => statement.name.text.endsWith(suffix)) &&
                            !roleContractSymbols.has(symbol))
                    ) {
                        continue;
                    }

                    const allGroups = [
                        ...collectIntersectionGroups(statement.type, sourceFile, checker),
                        ...getWrappedServicesIntersections(statement.type, checker).map(
                            servicesIntersection => ({
                                members: servicesIntersection.types.map(memberNode => ({
                                    name: memberNode.getText(sourceFile),
                                    node: memberNode,
                                    type: checker.getTypeFromTypeNode(memberNode),
                                })),
                                path: ['services'],
                            }),
                        ),
                    ];
                    const isNonRoleStateContract =
                        statement.name.text.endsWith('State') && !roleContractSymbols.has(symbol);
                    const groups = isNonRoleStateContract
                        ? allGroups.filter(group => group.path.length === 0).slice(0, 1)
                        : allGroups;
                    const propertyGroups = isNonRoleStateContract
                        ? []
                        : collectPropertyGroups(statement.type);

                    if (groups.length === 0 && propertyGroups.length === 0) {
                        continue;
                    }

                    contractsBySymbol.set(symbol, [
                        {
                            groups,
                            isOpaque: false,
                            name: statement.name.text,
                            propertyGroups,
                            rootPath: [],
                            symbol,
                            usages: [],
                        },
                    ]);
                }

                if (contractsBySymbol.size === 0) {
                    return;
                }

                // Record ambiguous escapes and hidden child-thunk requirements before evaluating
                // ordinary expression and property-path usages.
                markContractsUsedByOpaqueTypePositions(sourceFile, contractsBySymbol, checker);
                addDispatchedThunkUsages(sourceFile, contractsBySymbol, checker);

                const visitNode = (node: ts.Node) => {
                    if (ts.isParameter(node) && ts.isObjectBindingPattern(node.name)) {
                        const parameterType =
                            node.type === undefined
                                ? checker.getTypeAtLocation(node)
                                : checker.getTypeFromTypeNode(node.type);
                        const contracts = getContractsForType(parameterType, contractsBySymbol);

                        for (const contract of contracts) {
                            addBindingPatternUsages(node.name, contract, checker);
                        }
                    }

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

                    const reportedIntersectionMembers = new Set<ts.TypeNode>();

                    for (const group of contract.groups) {
                        const groupUsages = getGroupUsages(contract, group, checker);

                        if (groupUsages.length === 0) {
                            continue;
                        }

                        group.members.forEach((member, memberIndex) => {
                            const remainingTypes = group.members
                                .filter((_, index) => index !== memberIndex)
                                .map(remainingMember => remainingMember.type);
                            // Keep overlapping providers instead of choosing one arbitrarily.
                            // Otherwise, a member is necessary when removing it leaves any usage
                            // unsatisfied.
                            const isMemberUsed = groupUsages.some(
                                usage =>
                                    isUsageSatisfied(usage, [member.type], checker) ||
                                    !isUsageSatisfied(usage, remainingTypes, checker),
                            );

                            if (isMemberUsed) return;

                            reportedIntersectionMembers.add(member.node);
                            report(member.node, 'unusedIntersectionMember', {
                                memberName: member.name,
                                typeName: contract.name,
                            });
                        });
                    }

                    for (const group of contract.propertyGroups) {
                        const groupUsages = getGroupUsages(contract, group, checker);

                        if (groupUsages.length === 0) {
                            continue;
                        }

                        for (const member of group.members) {
                            if (
                                hasAncestorInSet(member.node, reportedIntersectionMembers) ||
                                isPropertyUsed(member, groupUsages, checker)
                            ) {
                                continue;
                            }

                            report(member.node, 'unusedContractMember', {
                                memberName: member.name,
                                typeName: contract.name,
                            });
                        }
                    }
                }
            },
        };
    },
};
