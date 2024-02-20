import { GuideCategory, GuideNode } from '@suite-common/suite-types';

/** @returns title in given language or in english if not available. */
export const getNodeTitle = (node: GuideNode, language: string): string =>
    node.title[language] || node.title.en;

export const getNodeById = (id: string, root: GuideNode): GuideNode | undefined => {
    if (id === root.id) {
        return root;
    }

    if (root.type !== 'category') {
        return undefined;
    }

    return root.children.map(child => getNodeById(id, child)).find(it => it !== undefined);
};

/**
 * @returns ids of ancestors of given node id.
 * Example: '/cryptocurrencies/ethereum' -> ['/', '/cryptocurrencies']
 */
export const getAncestorIds = (id: string): string[] =>
    id
        .split('/')
        // omit the node itself - only consider its ancestors
        .slice(0, -1)
        // 'Absolutize' each exploded parent, effectively getting its ID.
        .reduce<string[]>((ids, ancestor) => {
            const id = `${ids[ids.length - 1] || '/'}${ids.length > 1 ? '/' : ''}${ancestor}`;

            return [...ids, id];
        }, []);

/** @returns ancestors nodes for node. */
export const findAncestorNodes = (node: GuideNode, root: GuideCategory): GuideNode[] => {
    const ancestorIds = getAncestorIds(node.id);

    return (
        ancestorIds
            // omit root node as it is global ancestor
            .filter(id => id !== '/')
            .map(id => getNodeById(id, root))
            // omit not-existing nodes
            .filter((ancestorNode): ancestorNode is GuideNode => {
                if (ancestorNode === undefined) {
                    throw Error(`Ancestor node of '${node.id}' node was not found!`);
                }

                return true;
            })
    );
};
