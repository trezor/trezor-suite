import type { Rule } from 'eslint';
import ts from 'typescript';

import { getTypeReferenceName, getVariableFunction, toLowerCamelCase } from '../../utils';
import { createNamedContractRuleListener } from '../utils';

const getServiceDependencyMembers = (
    declaration: ts.TypeAliasDeclaration | ts.InterfaceDeclaration,
) => {
    if (ts.isInterfaceDeclaration(declaration)) {
        return declaration.members;
    }

    return ts.isTypeLiteralNode(declaration.type) ? declaration.type.members : [];
};

/** Enforces local, predictably named dependency contracts for DI service factories. */
export const enforceDiFactoryContractsRule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Enforces explicit, named dependency and return contracts for dependency-injected service factories.',
            category: 'Best Practices',
            recommended: false,
        },
        fixable: 'code',
        messages: {
            contractMustBeNamed:
                "Use the named '{{contractName}}' contract instead of an inline or differently named type.",
            contractMustBeSeparated:
                "Leave an empty line between '{{previousName}}' and '{{nextName}}'.",
            dependencyFactoryContractOrder:
                "Declare '{{depsName}}' before '{{serviceName}}' for '{{factoryName}}'.",
            dependencyFactoryParameter:
                "Pass '{{contractName}}' as a single 'deps' parameter to dependency-injected factory '{{factoryName}}'.",
            dependencyFactoryReturnType:
                "Give dependency-injected factory '{{factoryName}}' an explicit named service return type.",
            serviceDependencyProperty:
                "Expose the '{{serviceName}}' service as '{{propertyName}}' in its dependency contract.",
        },
        schema: [],
    },
    create: context =>
        createNamedContractRuleListener(
            context,
            ({
                createAdjacentDeclarationSwapFix,
                localTypeAliases,
                report,
                statements,
                validateContractBlockSpacing,
            }) => {
                const validateDependencyFactory = (
                    factoryName: string,
                    factoryNameNode: ts.Node,
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
                    // `createSave` creates the `Save` service, so it uses `SaveDeps`.
                    // `createSaveFactory` creates the `SaveFactory` service. Its own creator
                    // therefore uses `CreateSaveFactoryDeps`, which keeps the two factory
                    // layers distinguishable.
                    const expectedDepsName = factoryName.endsWith('Factory')
                        ? `${factoryName.charAt(0).toUpperCase()}${factoryName.slice(1)}Deps`
                        : `${serviceName}Deps`;
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
                    } else if (returnTypeName !== serviceName) {
                        report(factoryNameNode, 'contractMustBeNamed', {
                            consumerName: factoryName,
                            contractName: serviceName,
                        });
                    }

                    const expectedServiceDepName = `${serviceName}Dep`;
                    const expectedServicePropertyName = toLowerCamelCase(serviceName);

                    // A service does not always need a `Dep` wrapper. When it has one, keep the
                    // service name everywhere: `SaveFactory` becomes
                    // `{ saveFactory: SaveFactory }` inside `SaveFactoryDep`.
                    statements.forEach(statement => {
                        if (
                            (!ts.isTypeAliasDeclaration(statement) &&
                                !ts.isInterfaceDeclaration(statement)) ||
                            !statement.name.text.endsWith('Dep')
                        ) {
                            return;
                        }

                        const serviceProperties = getServiceDependencyMembers(statement).filter(
                            member =>
                                ts.isPropertySignature(member) &&
                                getTypeReferenceName(member.type) === serviceName,
                        );

                        serviceProperties.forEach(property => {
                            if (statement.name.text !== expectedServiceDepName) {
                                report(statement.name, 'contractMustBeNamed', {
                                    consumerName: serviceName,
                                    contractName: expectedServiceDepName,
                                });
                            }

                            if (
                                !ts.isIdentifier(property.name) ||
                                property.name.text !== expectedServicePropertyName
                            ) {
                                report(property.name, 'serviceDependencyProperty', {
                                    serviceName,
                                    propertyName: expectedServicePropertyName,
                                });
                            }
                        });
                    });

                    const depsDeclaration = localTypeAliases.get(expectedDepsName);

                    if (depsDeclaration === undefined) {
                        return;
                    }

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

                    if (!isInAdjacentTypeBlock) {
                        return;
                    }

                    if (
                        serviceDeclaration !== undefined &&
                        serviceStatementIndex !== undefined &&
                        depsStatementIndex > serviceStatementIndex
                    ) {
                        report(
                            depsDeclaration,
                            'dependencyFactoryContractOrder',
                            {
                                factoryName,
                                depsName: expectedDepsName,
                                serviceName: serviceDeclaration.name.text,
                            },
                            createAdjacentDeclarationSwapFix(serviceDeclaration, depsDeclaration),
                        );
                    }

                    validateContractBlockSpacing(firstContractIndex, statementIndex, factoryName);
                };

                statements.forEach((statement, statementIndex) => {
                    if (ts.isFunctionDeclaration(statement)) {
                        if (statement.name?.text.startsWith('create')) {
                            validateDependencyFactory(
                                statement.name.text,
                                statement.name,
                                statement,
                                statementIndex,
                            );
                        }

                        return;
                    }

                    if (!ts.isVariableStatement(statement)) {
                        return;
                    }

                    for (const declaration of statement.declarationList.declarations) {
                        if (
                            !ts.isIdentifier(declaration.name) ||
                            !declaration.name.text.startsWith('create')
                        ) {
                            continue;
                        }

                        const factoryFunction = getVariableFunction(declaration);

                        if (factoryFunction !== undefined) {
                            validateDependencyFactory(
                                declaration.name.text,
                                declaration.name,
                                factoryFunction,
                                statementIndex,
                            );
                        }
                    }
                });
            },
        ),
};
