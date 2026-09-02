import ts from 'typescript';

import { getFunctionExpression, getVariableFunction, unwrapExpression } from '../utils';

const thunkCreators = new Set(['createSingleInstanceThunk', 'createThunk']);

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

export const getThunkImplementationFromFunction = (outerFunction: ts.FunctionLikeDeclaration) => {
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

export const getThunkImplementation = (declaration: ts.VariableDeclaration) => {
    const outerFunction = getVariableFunction(declaration);

    return outerFunction === undefined
        ? undefined
        : getThunkImplementationFromFunction(outerFunction);
};

export const getRtkThunkCallExpression = (initializer: ts.Expression) => {
    const unwrappedInitializer = unwrapExpression(initializer);

    return ts.isCallExpression(unwrappedInitializer) &&
        ts.isIdentifier(unwrappedInitializer.expression) &&
        thunkCreators.has(unwrappedInitializer.expression.text)
        ? unwrappedInitializer
        : undefined;
};
