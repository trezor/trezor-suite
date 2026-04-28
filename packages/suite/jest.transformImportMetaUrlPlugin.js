module.exports = function transformImportMetaUrlPlugin({ types: t }) {
    return {
        name: 'transform-import-meta-url-for-jest',
        visitor: {
            MemberExpression(path) {
                if (
                    !t.isMetaProperty(path.node.object) ||
                    path.node.object.meta.name !== 'import' ||
                    path.node.object.property.name !== 'meta' ||
                    !t.isIdentifier(path.node.property, { name: 'url' }) ||
                    path.node.computed
                ) {
                    return;
                }

                path.replaceWith(
                    t.memberExpression(
                        t.callExpression(
                            t.memberExpression(
                                t.callExpression(t.identifier('require'), [t.stringLiteral('url')]),
                                t.identifier('pathToFileURL'),
                            ),
                            [t.identifier('__filename')],
                        ),
                        t.identifier('href'),
                    ),
                );
            },
        },
    };
};
