import { arrayPartition } from './arrayPartition';

/**
 * Not very effective implementation of topological sorting. Returns the `elements` sorted
 * so that x always precedes y if `precedes(x, y) === true` and the incomparable
 * elements' order is either preserved or sorted according to `tie`. Throws when there is
 * a cycle found in precedences.
 */
export const topologicalSort = <T>(
    elements: T[],
    precedes: (pred: T, succ: T) => boolean,
    tie?: (a: T, b: T) => number,
): T[] => {
    const result: T[] = [];
    const filterRoots = (verts: T[]) =>
        arrayPartition(verts, succ => !verts.some(pred => precedes(pred, succ)));

    let elem = elements;
    while (elem.length) {
        const [roots, rest] = filterRoots(elem);
        if (!roots.length) throw new Error('Cycle detected');
        result.push(...(tie ? roots.sort(tie) : roots));
        elem = rest;
    }

    return result;
};
