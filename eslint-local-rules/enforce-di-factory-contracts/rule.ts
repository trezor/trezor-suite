import type { Rule } from 'eslint';
import ts from 'typescript';

import {
    createNamedContractRuleListener,
    getTypeReferenceName,
    getVariableFunction,
} from '../named-contracts/utils';

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
                                factoryFunction,
                                statementIndex,
                            );
                        }
                    }
                });
            },
        ),
};
