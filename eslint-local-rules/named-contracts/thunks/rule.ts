import type { Rule } from 'eslint';
import ts from 'typescript';

import {
    getRtkThunkCallExpression,
    getThunkImplementation,
    getThunkImplementationFromFunction,
} from '../../thunks/utils';
import { getTypeReferenceName } from '../../utils';
import { createNamedContractRuleListener } from '../utils';

type RequiredContract = {
    expectedName: string;
    node: ts.TypeNode;
};

const capitalize = (name: string) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

const getThunkContractBaseName = (name: string) => {
    const capitalizedName = capitalize(name);

    return capitalizedName.endsWith('Thunk') ? capitalizedName : `${capitalizedName}Thunk`;
};

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

const getGetStateReturnType = (parameter: ts.ParameterDeclaration | undefined) => {
    if (parameter?.type === undefined) {
        return undefined;
    }

    return ts.isFunctionTypeNode(parameter.type) ? parameter.type.type : parameter.type;
};

/** Enforces local, predictably named state and dependency contracts for thunks. */
export const enforceThunkContractsRule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforces explicit, named State and Deps contracts for thunks.',
            category: 'Best Practices',
            recommended: false,
        },
        fixable: 'code',
        messages: {
            contractMustBeAdjacent:
                "Declare '{{contractName}}' in the contiguous type block directly above '{{consumerName}}'.",
            contractMustBeSeparated:
                "Leave an empty line between '{{previousName}}' and '{{nextName}}'.",
            contractOrder: "Declare '{{stateName}}' before '{{depsName}}' for '{{consumerName}}'.",
            contractMustBeNamed:
                "Use the named '{{contractName}}' contract instead of an inline or differently named type.",
            emptyThunkConfig: "Use explicit 'void' for dependency-free thunk '{{thunkName}}'.",
            missingThunkConfig:
                "Give thunk '{{thunkName}}' an explicit third generic: 'void' or a named State/Deps config.",
            stateContractMustBeExplicit:
                "Define '{{contractName}}' from the minimal RootState types the thunk reads; do not derive it from GetState or an app-wide state type.",
            thunkConfigMustBeInline:
                "Inline the RTK config for '{{thunkName}}' so its named State and Deps contracts stay visible.",
            voidContractProperty:
                "Omit '{{propertyName}}: void' from '{{thunkName}}'; use 'void' only as the complete dependency-free config.",
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
                sourceFile,
                statements,
                validateContractBlockSpacing,
            }) => {
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

                    const declaration = localTypeAliases.get(expectedName);
                    const declaredStateTypeName =
                        declaration !== undefined && ts.isTypeAliasDeclaration(declaration)
                            ? getTypeReferenceName(declaration.type)
                            : undefined;

                    if (
                        expectedName.endsWith('State') &&
                        declaration !== undefined &&
                        ts.isTypeAliasDeclaration(declaration) &&
                        (declaredStateTypeName === 'AppState' ||
                            declaredStateTypeName === 'GetState' ||
                            declaredStateTypeName === 'ReturnType')
                    ) {
                        report(declaration.type, 'stateContractMustBeExplicit', {
                            contractName: expectedName,
                        });
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
                        report(
                            depsDeclaration,
                            'contractOrder',
                            {
                                consumerName,
                                stateName: stateDeclaration.name.text,
                                depsName: depsDeclaration.name.text,
                            },
                            createAdjacentDeclarationSwapFix(depsDeclaration, stateDeclaration),
                        );
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

                statements.forEach((statement, statementIndex) => {
                    if (ts.isFunctionDeclaration(statement)) {
                        if (statement.name !== undefined) {
                            const vanillaThunk = getThunkImplementationFromFunction(statement);

                            if (vanillaThunk !== undefined) {
                                validateVanillaThunk(
                                    statement.name.text,
                                    vanillaThunk,
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
                        const rtkThunk = getRtkThunkCallExpression(declaration.initializer);

                        if (rtkThunk !== undefined) {
                            validateRtkThunk(declarationName, rtkThunk, statementIndex);
                            continue;
                        }

                        const vanillaThunk = getThunkImplementation(declaration);

                        if (vanillaThunk !== undefined) {
                            validateVanillaThunk(declarationName, vanillaThunk, statementIndex);
                        }
                    }
                });
            },
        ),
};
