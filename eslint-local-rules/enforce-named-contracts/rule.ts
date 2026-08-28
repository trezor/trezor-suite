import type { Rule } from 'eslint';
import ts from 'typescript';

type TypeAwareParserServices = {
    esTreeNodeToTSNodeMap?: ReadonlyMap<Rule.Node, ts.Node>;
    program?: ts.Program;
    tsNodeToESTreeNodeMap?: ReadonlyMap<ts.Node, Rule.Node>;
};

type RequiredContract = {
    expectedName: string;
    node: ts.TypeNode;
};

type MessageId =
    | 'contractMustBeAdjacent'
    | 'contractMustBeSeparated'
    | 'contractOrder'
    | 'contractMustBeNamed'
    | 'dependencyFactoryContractOrder'
    | 'dependencyFactoryParameter'
    | 'dependencyFactoryReturnType'
    | 'emptyThunkConfig'
    | 'missingThunkConfig'
    | 'thunkConfigMustBeInline'
    | 'voidContractProperty';

const thunkCreators = new Set(['createSingleInstanceThunk', 'createThunk']);

const capitalize = (name: string) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

const getThunkContractBaseName = (name: string) => {
    const capitalizedName = capitalize(name);

    if (capitalizedName.endsWith('Thunks')) {
        return capitalizedName.slice(0, -1);
    }

    if (capitalizedName.endsWith('ThunkInner')) {
        return capitalizedName.slice(0, -'Inner'.length);
    }

    return capitalizedName.endsWith('Thunk') ? capitalizedName : `${capitalizedName}Thunk`;
};

const unwrapExpression = (expression: ts.Expression): ts.Expression => {
    if (
        ts.isParenthesizedExpression(expression) ||
        ts.isAsExpression(expression) ||
        ts.isTypeAssertionExpression(expression) ||
        ts.isNonNullExpression(expression)
    ) {
        return unwrapExpression(expression.expression);
    }

    return expression;
};

const getFunctionExpression = (expression: ts.Expression) => {
    const unwrappedExpression = unwrapExpression(expression);

    return ts.isArrowFunction(unwrappedExpression) || ts.isFunctionExpression(unwrappedExpression)
        ? unwrappedExpression
        : undefined;
};

const getReturnedFunction = (functionNode: ts.FunctionLikeDeclaration) => {
    if (functionNode.body === undefined) {
        return undefined;
    }

    if (!ts.isBlock(functionNode.body)) {
        return getFunctionExpression(functionNode.body);
    }

    const returnStatements = functionNode.body.statements.filter(ts.isReturnStatement);
    const [returnStatement] = returnStatements;

    if (returnStatements.length !== 1 || returnStatement?.expression === undefined) {
        return undefined;
    }

    return getFunctionExpression(returnStatement.expression);
};

const getInnermostReturnedFunction = (functionNode: ts.FunctionLikeDeclaration) => {
    let currentFunction = functionNode;
    let returnedFunction = getReturnedFunction(currentFunction);

    while (returnedFunction !== undefined) {
        currentFunction = returnedFunction;
        returnedFunction = getReturnedFunction(currentFunction);
    }

    return currentFunction;
};

const getTypeReferenceName = (node: ts.TypeNode | undefined) =>
    node !== undefined && ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)
        ? node.typeName.text
        : undefined;

const getPropertyName = (node: ts.TypeElement) => {
    if (!ts.isPropertySignature(node) || node.name === undefined) {
        return undefined;
    }

    return ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name)
        ? node.name.text
        : undefined;
};

const isVoidType = (node: ts.TypeNode | undefined) =>
    node !== undefined && node.kind === ts.SyntaxKind.VoidKeyword;

const isEmptyContractType = (node: ts.TypeNode | undefined) => {
    if (node?.kind === ts.SyntaxKind.UnknownKeyword || isVoidType(node)) {
        return true;
    }

    if (node === undefined || !ts.isTypeReferenceNode(node) || !ts.isIdentifier(node.typeName)) {
        return false;
    }

    return (
        node.typeName.text === 'Record' &&
        node.typeArguments?.[0]?.kind === ts.SyntaxKind.NeverKeyword
    );
};

const getVariableFunction = (declaration: ts.VariableDeclaration) =>
    declaration.initializer === undefined
        ? undefined
        : getFunctionExpression(declaration.initializer);

const getThunkImplementationFromFunction = (outerFunction: ts.FunctionLikeDeclaration) => {
    const implementation = getInnermostReturnedFunction(outerFunction);
    const rawParameterNames = implementation.parameters.map(parameter =>
        ts.isIdentifier(parameter.name) ? parameter.name.text : '',
    );
    const parameterNames = rawParameterNames.map(name => name.replace(/^_/, ''));

    return (parameterNames[0] === 'dispatch' || rawParameterNames[0] === '_') &&
        (parameterNames[1] === 'getState' || parameterNames[2] === 'extra')
        ? implementation
        : undefined;
};

const getThunkImplementation = (declaration: ts.VariableDeclaration) => {
    const outerFunction = getVariableFunction(declaration);

    return outerFunction === undefined
        ? undefined
        : getThunkImplementationFromFunction(outerFunction);
};

const getGetStateReturnType = (parameter: ts.ParameterDeclaration | undefined) => {
    if (parameter?.type === undefined) {
        return undefined;
    }

    return ts.isFunctionTypeNode(parameter.type) ? parameter.type.type : parameter.type;
};

/**
 * Enforces local, predictably named state and dependency contracts for thunks and DI factories.
 */
export const enforceNamedContractsRule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Enforces explicit, named State and Deps contracts for thunks and dependency-injected service factories.',
            category: 'Best Practices',
            recommended: false,
        },
        fixable: 'whitespace',
        messages: {
            contractMustBeAdjacent:
                "Declare '{{contractName}}' in the contiguous type block directly above '{{consumerName}}'.",
            contractMustBeSeparated:
                "Leave an empty line between '{{previousName}}' and '{{nextName}}'.",
            contractOrder: "Declare '{{stateName}}' before '{{depsName}}' for '{{consumerName}}'.",
            contractMustBeNamed:
                "Use the named '{{contractName}}' contract instead of an inline or differently named type.",
            dependencyFactoryParameter:
                "Pass '{{contractName}}' as a single 'deps' parameter to dependency-injected factory '{{factoryName}}'.",
            dependencyFactoryContractOrder:
                "Declare '{{depsName}}' before '{{serviceName}}' for '{{factoryName}}'.",
            dependencyFactoryReturnType:
                "Give dependency-injected factory '{{factoryName}}' an explicit named service return type.",
            emptyThunkConfig: "Use explicit 'void' for dependency-free thunk '{{thunkName}}'.",
            missingThunkConfig:
                "Give thunk '{{thunkName}}' an explicit third generic: 'void' or a named State/Deps config.",
            thunkConfigMustBeInline:
                "Inline the RTK config for '{{thunkName}}' so its named State and Deps contracts stay visible.",
            voidContractProperty:
                "Omit '{{propertyName}}: void' from '{{thunkName}}'; use 'void' only as the complete dependency-free config.",
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

        return {
            'Program:exit': programNode => {
                const sourceFile = parserServices.esTreeNodeToTSNodeMap?.get(
                    programNode as Rule.Node,
                );

                if (sourceFile === undefined || !ts.isSourceFile(sourceFile)) {
                    return;
                }

                const { statements } = sourceFile;
                const localTypeAliases = new Map(
                    statements
                        .filter(ts.isTypeAliasDeclaration)
                        .map(declaration => [declaration.name.text, declaration] as const),
                );

                const report = (
                    node: ts.Node,
                    messageId: MessageId,
                    data: Record<string, string>,
                ) => {
                    const reportNode = parserServices.tsNodeToESTreeNodeMap?.get(node);

                    if (reportNode !== undefined) {
                        context.report({ node: reportNode, messageId, data });
                    }
                };

                const validateContractBlockSpacing = (
                    firstStatementIndex: number,
                    consumerStatementIndex: number,
                    consumerName: string,
                ) => {
                    const contractBlock = statements.slice(
                        firstStatementIndex,
                        consumerStatementIndex + 1,
                    );

                    for (let index = 1; index < contractBlock.length; index += 1) {
                        const previousStatement = contractBlock[index - 1];
                        const nextStatement = contractBlock[index];

                        if (previousStatement === undefined || nextStatement === undefined) {
                            continue;
                        }

                        const textBetweenStatements = sourceFile.text.slice(
                            previousStatement.end,
                            nextStatement.getStart(sourceFile),
                        );

                        if (/\r?\n[\t ]*\r?\n/u.test(textBetweenStatements)) {
                            continue;
                        }

                        const previousName =
                            (ts.isTypeAliasDeclaration(previousStatement) ||
                                ts.isInterfaceDeclaration(previousStatement)) &&
                            previousStatement.name.text;
                        const nextName =
                            (ts.isTypeAliasDeclaration(nextStatement) ||
                                ts.isInterfaceDeclaration(nextStatement)) &&
                            nextStatement.name.text;
                        const reportNode = parserServices.tsNodeToESTreeNodeMap?.get(nextStatement);

                        if (reportNode !== undefined) {
                            context.report({
                                node: reportNode,
                                messageId: 'contractMustBeSeparated',
                                data: {
                                    previousName: previousName || 'the previous declaration',
                                    nextName: nextName || consumerName,
                                },
                                fix: fixer => {
                                    const { line } = sourceFile.getLineAndCharacterOfPosition(
                                        nextStatement.getStart(sourceFile),
                                    );
                                    const start = sourceFile.getPositionOfLineAndCharacter(line, 0);

                                    return fixer.insertTextBeforeRange([start, start], '\n');
                                },
                            });
                        }
                    }
                };

                const validateNamedContract = (
                    node: ts.TypeNode | undefined,
                    expectedName: string,
                    consumerName: string,
                    requiredContracts: RequiredContract[],
                ) => {
                    if (node === undefined || getTypeReferenceName(node) !== expectedName) {
                        report(node ?? sourceFile, 'contractMustBeNamed', {
                            consumerName,
                            contractName: expectedName,
                        });

                        return;
                    }

                    requiredContracts.push({ expectedName, node });
                };

                const validateAdjacentContracts = (
                    statementIndex: number,
                    consumerName: string,
                    requiredContracts: readonly RequiredContract[],
                ) => {
                    if (requiredContracts.length === 0) {
                        return;
                    }

                    const adjacentTypeNames: string[] = [];

                    for (let index = statementIndex - 1; index >= 0; index -= 1) {
                        const statement = statements[index];

                        if (statement === undefined) {
                            break;
                        }

                        if (
                            !ts.isTypeAliasDeclaration(statement) &&
                            !ts.isInterfaceDeclaration(statement)
                        ) {
                            break;
                        }

                        adjacentTypeNames.push(statement.name.text);
                    }

                    for (const contract of requiredContracts) {
                        if (
                            adjacentTypeNames.includes(contract.expectedName) &&
                            localTypeAliases.has(contract.expectedName)
                        ) {
                            continue;
                        }

                        report(contract.node, 'contractMustBeAdjacent', {
                            consumerName,
                            contractName: contract.expectedName,
                        });
                    }

                    const contractDeclarations = requiredContracts.flatMap(contract => {
                        const declaration = localTypeAliases.get(contract.expectedName);

                        return declaration === undefined ? [] : [declaration];
                    });

                    if (
                        contractDeclarations.length !== requiredContracts.length ||
                        contractDeclarations.some(
                            declaration => !adjacentTypeNames.includes(declaration.name.text),
                        )
                    ) {
                        return;
                    }

                    const stateDeclaration = contractDeclarations.find(declaration =>
                        declaration.name.text.endsWith('State'),
                    );
                    const depsDeclaration = contractDeclarations.find(declaration =>
                        declaration.name.text.endsWith('Deps'),
                    );

                    if (
                        stateDeclaration !== undefined &&
                        depsDeclaration !== undefined &&
                        statements.indexOf(stateDeclaration) > statements.indexOf(depsDeclaration)
                    ) {
                        report(depsDeclaration, 'contractOrder', {
                            consumerName,
                            stateName: stateDeclaration.name.text,
                            depsName: depsDeclaration.name.text,
                        });
                    }

                    const firstContractIndex = Math.min(
                        ...contractDeclarations.map(declaration => statements.indexOf(declaration)),
                    );

                    validateContractBlockSpacing(firstContractIndex, statementIndex, consumerName);
                };

                const validateRtkThunk = (
                    thunkName: string,
                    callExpression: ts.CallExpression,
                    statementIndex: number,
                ) => {
                    const configType = callExpression.typeArguments?.[2];

                    if (configType === undefined) {
                        report(callExpression, 'missingThunkConfig', { thunkName });

                        return;
                    }

                    if (isVoidType(configType)) {
                        return;
                    }

                    if (!ts.isTypeLiteralNode(configType)) {
                        report(configType, 'thunkConfigMustBeInline', { thunkName });

                        return;
                    }

                    const contractBaseName = getThunkContractBaseName(thunkName);
                    const requiredContracts: RequiredContract[] = [];
                    let hasNonContractConfig = false;
                    let hasStateOrDeps = false;

                    for (const member of configType.members) {
                        const propertyName = getPropertyName(member);

                        if (propertyName !== 'state' && propertyName !== 'extra') {
                            hasNonContractConfig = true;
                            continue;
                        }

                        if (!ts.isPropertySignature(member) || member.type === undefined) {
                            continue;
                        }

                        hasStateOrDeps = true;

                        if (isVoidType(member.type)) {
                            report(member.type, 'voidContractProperty', {
                                propertyName,
                                thunkName,
                            });
                            continue;
                        }

                        const suffix = propertyName === 'state' ? 'State' : 'Deps';
                        validateNamedContract(
                            member.type,
                            `${contractBaseName}${suffix}`,
                            thunkName,
                            requiredContracts,
                        );
                    }

                    if (!hasStateOrDeps && !hasNonContractConfig) {
                        report(configType, 'emptyThunkConfig', { thunkName });
                    }

                    validateAdjacentContracts(statementIndex, thunkName, requiredContracts);
                };

                const validateVanillaThunk = (
                    thunkName: string,
                    implementation: ts.FunctionLikeDeclaration,
                    statementIndex: number,
                ) => {
                    const contractBaseName = getThunkContractBaseName(thunkName);
                    const requiredContracts: RequiredContract[] = [];
                    const getStateType = getGetStateReturnType(implementation.parameters[1]);
                    const extraType = implementation.parameters[2]?.type;

                    if (
                        implementation.parameters[1] !== undefined &&
                        !isEmptyContractType(getStateType)
                    ) {
                        validateNamedContract(
                            getStateType,
                            `${contractBaseName}State`,
                            thunkName,
                            requiredContracts,
                        );
                    }

                    if (
                        implementation.parameters[2] !== undefined &&
                        !isEmptyContractType(extraType)
                    ) {
                        validateNamedContract(
                            extraType,
                            `${contractBaseName}Deps`,
                            thunkName,
                            requiredContracts,
                        );
                    }

                    validateAdjacentContracts(statementIndex, thunkName, requiredContracts);
                };

                const validateDependencyFactory = (
                    factoryName: string,
                    factoryFunction: ts.FunctionLikeDeclaration,
                    statementIndex: number,
                ) => {
                    // Composition roots and dependency-object builders wire services together;
                    // they are not factories for the service named after `create`.
                    if (factoryName.endsWith('CompositionRoot') || factoryName.endsWith('Deps')) {
                        return;
                    }

                    const depsParameter = factoryFunction.parameters[0];

                    if (depsParameter === undefined) {
                        return;
                    }

                    const serviceName = factoryName.slice('create'.length);
                    const expectedDepsName = `${serviceName}Deps`;
                    const actualDepsName = getTypeReferenceName(depsParameter.type);
                    const isNamedDepsParameter =
                        ts.isIdentifier(depsParameter.name) && depsParameter.name.text === 'deps';

                    if (!isNamedDepsParameter && !actualDepsName?.endsWith('Deps')) {
                        return;
                    }

                    if (!isNamedDepsParameter) {
                        report(depsParameter.name, 'dependencyFactoryParameter', {
                            factoryName,
                            contractName: expectedDepsName,
                        });
                    }

                    if (actualDepsName !== expectedDepsName) {
                        report(depsParameter.type ?? depsParameter, 'contractMustBeNamed', {
                            consumerName: factoryName,
                            contractName: expectedDepsName,
                        });
                    }

                    const returnTypeName = getTypeReferenceName(factoryFunction.type);

                    if (returnTypeName === undefined) {
                        report(factoryFunction, 'dependencyFactoryReturnType', { factoryName });
                    }

                    const depsDeclaration = localTypeAliases.get(expectedDepsName);

                    if (depsDeclaration !== undefined) {
                        const depsStatementIndex = statements.indexOf(depsDeclaration);
                        const serviceDeclaration =
                            returnTypeName === undefined
                                ? undefined
                                : localTypeAliases.get(returnTypeName);
                        const serviceStatementIndex =
                            serviceDeclaration === undefined
                                ? undefined
                                : statements.indexOf(serviceDeclaration);
                        const firstContractIndex = Math.min(
                            depsStatementIndex,
                            serviceStatementIndex ?? depsStatementIndex,
                        );
                        const isInAdjacentTypeBlock = statements
                            .slice(firstContractIndex, statementIndex)
                            .every(
                                statement =>
                                    ts.isTypeAliasDeclaration(statement) ||
                                    ts.isInterfaceDeclaration(statement),
                            );

                        if (isInAdjacentTypeBlock) {
                            if (
                                serviceDeclaration !== undefined &&
                                serviceStatementIndex !== undefined &&
                                depsStatementIndex > serviceStatementIndex
                            ) {
                                report(depsDeclaration, 'dependencyFactoryContractOrder', {
                                    factoryName,
                                    depsName: expectedDepsName,
                                    serviceName: serviceDeclaration.name.text,
                                });
                            }

                            validateContractBlockSpacing(
                                firstContractIndex,
                                statementIndex,
                                factoryName,
                            );
                        }
                    }
                };

                statements.forEach((statement, statementIndex) => {
                    if (ts.isFunctionDeclaration(statement)) {
                        if (statement.name !== undefined) {
                            const declarationName = statement.name.text;
                            const vanillaThunk = getThunkImplementationFromFunction(statement);

                            if (vanillaThunk !== undefined) {
                                validateVanillaThunk(declarationName, vanillaThunk, statementIndex);
                            }

                            if (declarationName.startsWith('create')) {
                                validateDependencyFactory(
                                    declarationName,
                                    statement,
                                    statementIndex,
                                );
                            }
                        }

                        return;
                    }

                    if (!ts.isVariableStatement(statement)) {
                        return;
                    }

                    for (const declaration of statement.declarationList.declarations) {
                        if (
                            !ts.isIdentifier(declaration.name) ||
                            declaration.initializer === undefined
                        ) {
                            continue;
                        }

                        const declarationName = declaration.name.text;
                        const unwrappedInitializer = unwrapExpression(declaration.initializer);

                        if (
                            ts.isCallExpression(unwrappedInitializer) &&
                            ts.isIdentifier(unwrappedInitializer.expression) &&
                            thunkCreators.has(unwrappedInitializer.expression.text)
                        ) {
                            validateRtkThunk(declarationName, unwrappedInitializer, statementIndex);
                            continue;
                        }

                        const vanillaThunk = getThunkImplementation(declaration);

                        if (vanillaThunk !== undefined) {
                            validateVanillaThunk(declarationName, vanillaThunk, statementIndex);
                        }

                        if (declarationName.startsWith('create')) {
                            const factoryFunction = getVariableFunction(declaration);

                            if (factoryFunction !== undefined) {
                                validateDependencyFactory(
                                    declarationName,
                                    factoryFunction,
                                    statementIndex,
                                );
                            }
                        }
                    }
                });
            },
        };
    },
};
