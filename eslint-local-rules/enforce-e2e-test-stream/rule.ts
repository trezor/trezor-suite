import type { Rule } from 'eslint';
import type { CallExpression, Expression, ObjectExpression, Property, SpreadElement } from 'estree';

const TEST_MODIFIERS = new Set(['skip', 'fixme', 'only']);
const ANNOTATION_HELPER = 'createTestAnnotation';
const STREAM_ENUM = 'TestStream';

const isTestCall = (node: CallExpression) => {
    const { callee } = node;
    if (callee.type === 'Identifier') {
        return callee.name === 'test';
    }

    // test.skip / test.fixme / test.only declare tests; test.describe, test.use and the hooks do not.
    return (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'test' &&
        callee.property.type === 'Identifier' &&
        TEST_MODIFIERS.has(callee.property.name)
    );
};

const isTestBody = (node: Expression | SpreadElement | undefined) =>
    node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression';

const findAnnotation = (options: ObjectExpression): Property | undefined =>
    options.properties.find(
        (property): property is Property =>
            property.type === 'Property' &&
            ((property.key.type === 'Identifier' && property.key.name === 'annotation') ||
                (property.key.type === 'Literal' && property.key.value === 'annotation')),
    );

const isAnnotationHelperCall = (annotation: Property['value']) =>
    annotation.type === 'CallExpression' &&
    annotation.callee.type === 'Identifier' &&
    annotation.callee.name === ANNOTATION_HELPER;

/**
 * Guards the one thing types cannot: a test that carries no annotation at all, so
 * `TestMetadataInput` never applies and the reporter falls back to an unassigned stream.
 */
export const enforceE2eTestStreamRule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Enforces that every e2e test declares its owning team through a createTestAnnotation call.',
            recommended: false,
        },
        messages: {
            annotationShape: `Build the annotation with ${ANNOTATION_HELPER}({ ... }) so its metadata is type-checked.`,
            missingAnnotation: `This test's options have no annotation. Add annotation: ${ANNOTATION_HELPER}({ stream: ${STREAM_ENUM}.Wallet }) next to the options that are already there.`,
            missingOptions: `This test has no options object. Insert { annotation: ${ANNOTATION_HELPER}({ stream: ${STREAM_ENUM}.Wallet }) } between the title and the test body.`,
            optionsNotObject: `Spread the options into an object literal so the annotation stays visible: { ...{{name}}, annotation: ${ANNOTATION_HELPER}({ stream: ${STREAM_ENUM}.Wallet }) }.`,
        },
        schema: [],
    },
    create(context) {
        return {
            CallExpression(node) {
                const call = node as unknown as CallExpression;
                if (!isTestCall(call)) {
                    return;
                }

                const [, options] = call.arguments;
                if (!options || isTestBody(options)) {
                    context.report({ node, messageId: 'missingOptions' });

                    return;
                }

                if (options.type !== 'ObjectExpression') {
                    context.report({
                        node: options as Rule.Node,
                        messageId: 'optionsNotObject',
                        data: { name: options.type === 'Identifier' ? options.name : 'options' },
                    });

                    return;
                }

                const annotation = findAnnotation(options);
                if (!annotation) {
                    context.report({ node: options as Rule.Node, messageId: 'missingAnnotation' });

                    return;
                }

                if (!isAnnotationHelperCall(annotation.value)) {
                    context.report({
                        node: annotation.value as Rule.Node,
                        messageId: 'annotationShape',
                    });
                }
            },
        };
    },
};
