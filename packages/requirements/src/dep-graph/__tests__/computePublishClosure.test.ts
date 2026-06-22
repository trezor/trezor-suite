import { computePublishClosure } from '../computePublishClosure';
import type { PackageDepsResolver } from '../computePublishClosure';

const makeGetDeps =
    (graph: Record<string, string[]>): PackageDepsResolver =>
    pkg =>
        graph[pkg] ?? [];

describe(computePublishClosure.name, () => {
    it('returns the root packages even when they have no dependencies', () => {
        const closure = computePublishClosure(['connect'], makeGetDeps({ connect: [] }));

        expect([...closure]).toEqual(['connect']);
    });

    it('walks transitive dependencies (BFS)', () => {
        const graph = {
            connect: ['connect-common', 'transport'],
            'connect-common': ['utils'],
            transport: ['protocol'],
            utils: [],
            protocol: [],
        };

        const closure = computePublishClosure(['connect'], makeGetDeps(graph));

        expect(closure).toEqual(
            new Set(['connect', 'connect-common', 'transport', 'utils', 'protocol']),
        );
    });

    it('deduplicates packages reached through multiple paths', () => {
        const graph = {
            connect: ['connect-common', 'connect-data'],
            'connect-common': ['utils'],
            'connect-data': ['utils'],
            utils: [],
        };

        const closure = computePublishClosure(['connect'], makeGetDeps(graph));

        expect(closure.size).toBe(4);
        expect(closure).toEqual(new Set(['connect', 'connect-common', 'connect-data', 'utils']));
    });

    it('handles cycles without infinite looping', () => {
        const graph = {
            a: ['b'],
            b: ['c'],
            c: ['a'],
        };

        const closure = computePublishClosure(['a'], makeGetDeps(graph));

        expect(closure).toEqual(new Set(['a', 'b', 'c']));
    });

    it('merges closures of multiple roots', () => {
        const graph = {
            connect: ['connect-common'],
            'connect-mobile': ['connect-common', 'react-native-bridge'],
            'connect-common': [],
            'react-native-bridge': [],
        };

        const closure = computePublishClosure(['connect', 'connect-mobile'], makeGetDeps(graph));

        expect(closure).toEqual(
            new Set(['connect', 'connect-mobile', 'connect-common', 'react-native-bridge']),
        );
    });

    it('returns an empty set when given no roots', () => {
        const closure = computePublishClosure([], makeGetDeps({}));

        expect(closure.size).toBe(0);
    });
});
