import { ReactNode, isValidElement, cloneElement, Key } from 'react';

type RewriteReactNodeRecursivelyCallback = (stringSubNode: string) => string;

/**
 * Recursively crawls ReactNode and applies callback on all string subnodes
 * @param node ReactNode to be recursively crawled & modified
 * @param callback function to be applied on all string subnodes
 * @param reactKey optional React key applied on the root node, if it is a ReactElement. Used internally.
 * @returns modified ReactNode
 */
export const rewriteReactNodeRecursively = (
    node: ReactNode,
    callback: RewriteReactNodeRecursivelyCallback,
    reactKey?: Key,
): ReactNode => {
    if (typeof node === 'string') return callback(node);
    if (typeof node === 'number') return callback(node.toString());

    if (Array.isArray(node)) {
        return node.map((child, index) => {
            const newReactKey: Key | undefined = isValidElement(child)
                ? child.key ?? index
                : undefined;

            return rewriteReactNodeRecursively(child, callback, newReactKey);
        });
    }

    if (isValidElement(node)) {
        const rewrittenChildren = rewriteReactNodeRecursively(node.props.children, callback);

        return cloneElement(node, { ...node.props, key: reactKey, children: rewrittenChildren });
    }

    return node;
};
