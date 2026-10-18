import type { Rule } from 'eslint';
import type { MemberExpression } from 'estree';
import ts from 'typescript';

import { getTypeScriptParserServices } from '../utils';

// `Object.fromEntries` has an `(entries: Iterable<readonly any[]>): any` overload. Entries passed
// inline are contextually typed as tuples and pick the typed overload, but entries stored in a
// variable first (`const entries = keys.map(key => [key, value])`) infer as `T[][]`, match the `any`
// overload, and leave every annotation or return type on the result unchecked.

const isObjectFromEntriesCallee = (callee: Rule.Node | MemberExpression['object']) => {
    if (callee.type !== 'MemberExpression') {
        return false;
    }

    const { object, property } = callee;
    const isObject = object.type === 'Identifier' && object.name === 'Object';
    const isFromEntries = callee.computed
        ? property.type === 'Literal' && property.value === 'fromEntries'
        : property.type === 'Identifier' && property.name === 'fromEntries';

    return isObject && isFromEntries;
};

export const noAnyObjectFromEntriesRule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallows `Object.fromEntries()` calls that resolve to the `any` overload, which leaves the result unchecked.',
            category: 'Possible Errors',
            recommended: false,
        },
        messages: {
            anyResult:
                'This `Object.fromEntries()` call returns `any`, so nothing checks the result against its annotation or usage. Pass the entries inline, type them as tuples (`[key, value] as const`), or use `typedObjectFromEntries` from @trezor/utils.',
        },
        schema: [],
    },
    create: context => {
        const parserServices = getTypeScriptParserServices(context);

        if (parserServices === undefined) {
            return {};
        }

        const checker = parserServices.program.getTypeChecker();

        return {
            CallExpression: node => {
                if (!isObjectFromEntriesCallee(node.callee)) {
                    return;
                }

                // A cast of the result is reported by the `no-restricted-syntax` cast selectors.
                if ((node.parent as { type: string }).type === 'TSAsExpression') {
                    return;
                }

                const tsNode = parserServices.getTypeScriptNode(node as Rule.Node);

                if (tsNode === undefined) {
                    return;
                }

                if (checker.getTypeAtLocation(tsNode).flags & ts.TypeFlags.Any) {
                    context.report({ node: node.callee, messageId: 'anyResult' });
                }
            },
        };
    },
};
