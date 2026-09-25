import { createEntityIndex } from './createEntityIndex';

type Thing = { id: string; value: string };

type State = { things: Thing[] };

const createState = (things: Thing[]): State => ({ things });

const a = { id: 'a', value: 'first' };
const b = { id: 'b', value: 'second' };

const createIndex = () => {
    const getEntities = jest.fn((things: Thing[]) => things);

    const index = createEntityIndex({
        name: 'things',
        selectSource: (state: State) => state.things,
        getEntities,
        getId: (thing: Thing) => thing.id,
    });

    return { index, getEntities };
};

describe('an index over a source that is already its entities', () => {
    const createBareIndex = () =>
        createEntityIndex({
            name: 'bareThings',
            selectSource: (state: State) => state.things,
            getId: (thing: Thing) => thing.id,
            secondaryIndexes: { byValue: (thing: Thing) => thing.value },
        });

    it('takes the source for the entities when it is not told how to read them', () => {
        const index = createBareIndex();

        expect(index.getById(createState([a, b]), 'b')).toBe(b);
    });

    it('lists them in the order the source holds them', () => {
        const index = createBareIndex();

        expect(index.getIds(createState([b, a]))).toEqual(['b', 'a']);
    });

    it('indexes them by a secondary key', () => {
        const index = createBareIndex();

        expect(index.getBySecondaryKey(createState([a, b]), 'byValue', 'second')).toEqual([b]);
    });

    it('rebuilds when the source is replaced', () => {
        const index = createBareIndex();
        index.getIds(createState([a]));

        expect(index.getIds(createState([a, b]))).toEqual(['a', 'b']);
    });
});

describe('createEntityIndex', () => {
    it('builds nothing until it is read', () => {
        const { getEntities } = createIndex();

        expect(getEntities).not.toHaveBeenCalled();
    });

    it('finds an entity by its id', () => {
        const { index } = createIndex();
        const state = createState([a, b]);

        expect(index.getById(state, 'b')).toBe(b);
    });

    it('answers with nothing for an id it does not hold', () => {
        const { index } = createIndex();

        expect(index.getById(createState([a]), 'b')).toBeUndefined();
    });

    it('maps a list of ids onto the entities it holds', () => {
        const { index } = createIndex();
        const state = createState([a, b]);

        expect(index.getByIds(state, ['b', 'a'])).toEqual([b, a]);
    });

    it('leaves out the ids it does not hold', () => {
        const { index } = createIndex();

        expect(index.getByIds(createState([a]), ['a', 'b'])).toEqual([a]);
    });

    it('takes any iterable of ids', () => {
        const { index } = createIndex();
        const state = createState([a, b]);

        expect(index.getByIds(state, new Set(['a', 'b']))).toEqual([a, b]);
    });

    it('answers a list that matches nothing with the shared empty array', () => {
        const { index } = createIndex();
        const state = createState([a]);

        expect(index.getByIds(state, ['b'])).toBe(index.getByIds(state, []));
    });

    it('hands back the same entities while the index and the list are unchanged', () => {
        const { index } = createIndex();
        const state = createState([a, b]);
        const ids = ['a', 'b'];

        expect(index.getByIds(state, ids)).toBe(index.getByIds(state, ids));
    });

    it('maps the list again when the source changed', () => {
        const { index } = createIndex();
        const ids = ['a', 'b'];
        const found = index.getByIds(createState([a, b]), ids);

        expect(index.getByIds(createState([a, { ...b, value: 'changed' }]), ids)).not.toBe(found);
    });

    it('lists ids in the order the source yields them', () => {
        const { index } = createIndex();

        expect(index.getIds(createState([b, a]))).toEqual(['b', 'a']);
    });

    describe('what it keeps between reads', () => {
        it('builds once for repeated reads of an unchanged source', () => {
            // The point of the index: a re-render that changed nothing else costs one comparison.
            // A list of a hundred rows reads it a hundred times on its first render, and those
            // are one build.
            const { index, getEntities } = createIndex();
            const state = createState([a, b]);

            index.read(state);
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(1);
        });

        it('hands back the same snapshot, so consumers can compare by reference', () => {
            const { index } = createIndex();
            const state = createState([a, b]);

            expect(index.read(state)).toBe(index.read(state));
        });

        it('rebuilds when the source is replaced', () => {
            const { index } = createIndex();
            const updated = { ...b, value: 'changed' };

            expect(index.getById(createState([a, b]), 'b')).toBe(b);
            expect(index.getById(createState([a, updated]), 'b')).toBe(updated);
        });

        it('does not rebuild for a state object that kept the same source', () => {
            // Reducers other than this one write on every action; those writes must not cost a
            // rebuild here.
            const { index, getEntities } = createIndex();
            const things = [a, b];

            index.read({ things });
            index.read({ things });

            expect(getEntities).toHaveBeenCalledTimes(1);
        });

        it('keeps its build when a listener unsubscribes', () => {
            // A listener coming or going says nothing about what readers need, and must not cost
            // one of them a rebuild.
            const { index, getEntities } = createIndex();
            const unsubscribe = index.subscribe(() => {});
            const state = createState([a, b]);

            index.read(state);
            unsubscribe();
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(1);
        });
    });

    describe('ids that repeat', () => {
        const duplicate = { id: 'a', value: 'also first' };

        it('says so rather than answer two ways about one id', () => {
            // Whichever of them the index kept, something would be wrong with what it answers:
            // `getById` would name one entity and a secondary index could hold the other.
            const { index } = createIndex();

            expect(() => index.getIds(createState([a, duplicate]))).toThrow(
                'entity index "things" was given two entities with the id a',
            );
        });

        it('says it when asked for an entity, too', () => {
            const { index } = createIndex();

            expect(() => index.getById(createState([a, duplicate]), 'a')).toThrow();
        });
    });

    it('goes back to the one empty snapshot once everything is gone', () => {
        // The write that empties it has removals to report, so it gets a snapshot of its own; the
        // writes after that have nothing to say and are the shared empty one again.
        const { index } = createIndex();
        index.read(createState([a]));
        index.read(createState([]));

        expect(index.read(createState([]))).toBe(index.read(createState([])));
    });

    it('does not tell a listener about a write that emptied an index that was already empty', () => {
        const { index } = createIndex();
        const listener = jest.fn();
        index.subscribe(listener);
        index.read(createState([a]));
        index.read(createState([]));
        listener.mockClear();

        index.read(createState([]));
        index.read(createState([]));

        expect(listener).not.toHaveBeenCalled();
    });

    it('shares one empty snapshot, so an empty index is stable across sources', () => {
        const { index } = createIndex();

        expect(index.read(createState([]))).toBe(index.read(createState([])));
    });

    it('shares one empty list of ids once everything is gone', () => {
        // A source that empties out is built again, but nothing it holds should look new.
        const { index } = createIndex();
        index.read(createState([a]));

        expect(index.getIds(createState([]))).toBe(index.getIds(createState([])));
    });
});

describe('what a rebuild changed', () => {
    const readChanges = (index: ReturnType<typeof createIndex>['index'], state: State) =>
        index.read(state).getChanges();

    it('is nothing on the first build, which nobody can have missed', () => {
        const { index } = createIndex();

        expect(readChanges(index, createState([a, b]))).toEqual({
            added: [],
            removed: [],
            updated: [],
        });
    });

    it('reports an entity that arrived', () => {
        const { index } = createIndex();
        index.read(createState([a]));

        expect(readChanges(index, createState([a, b]))).toEqual({
            added: ['b'],
            removed: [],
            updated: [],
        });
    });

    it('reports an entity that went away', () => {
        const { index } = createIndex();
        index.read(createState([a, b]));

        expect(readChanges(index, createState([a]))).toEqual({
            added: [],
            removed: ['b'],
            updated: [],
        });
    });

    it('reports an entity that is a different object than it was', () => {
        const { index } = createIndex();
        index.read(createState([a, b]));

        expect(readChanges(index, createState([a, { ...b, value: 'changed' }]))).toEqual({
            added: [],
            removed: [],
            updated: ['b'],
        });
    });

    it('says nothing about an entity that is the same object as before', () => {
        const { index } = createIndex();
        index.read(createState([a, b]));

        // `a` is carried across untouched, so it is in none of the three lists.
        expect(readChanges(index, createState([a, { ...b, value: 'changed' }])).updated).toEqual([
            'b',
        ]);
    });

    it('says nothing about an entity that only moved within the source', () => {
        const { index } = createIndex();
        index.read(createState([a, b]));

        expect(index.read(createState([b, a])).getChanges()).toEqual({
            added: [],
            removed: [],
            updated: [],
        });
    });
});

describe('being told when the index changes', () => {
    it('calls a listener with the new snapshot when a read finds a change', () => {
        const { index } = createIndex();
        const listener = jest.fn();
        index.subscribe(listener);
        index.read(createState([a]));
        listener.mockClear();

        index.read(createState([a, b]));

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener.mock.calls[0]?.[0].getChanges()).toEqual({
            added: ['b'],
            removed: [],
            updated: [],
        });
    });

    it('says nothing when a read finds the source unchanged', () => {
        const { index } = createIndex();
        const listener = jest.fn();
        index.subscribe(listener);
        const state = createState([a, b]);
        index.read(state);
        listener.mockClear();

        index.read(state);

        expect(listener).not.toHaveBeenCalled();
    });

    it('tells every listener', () => {
        const { index } = createIndex();
        const first = jest.fn();
        const second = jest.fn();
        index.subscribe(first);
        index.subscribe(second);
        index.read(createState([a]));

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('stops telling a listener that unsubscribed', () => {
        const { index } = createIndex();
        const listener = jest.fn();
        const unsubscribe = index.subscribe(listener);
        index.read(createState([a]));
        unsubscribe();

        index.read(createState([a, b]));

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('says nothing while nothing reads the index', () => {
        // A read is the only moment the index looks at the source, so an index nothing reads
        // notifies nothing — the same laziness as everywhere else here.
        const { index, getEntities } = createIndex();
        const listener = jest.fn();
        index.subscribe(listener);

        expect(listener).not.toHaveBeenCalled();
        expect(getEntities).not.toHaveBeenCalled();
    });

    it('carries on when one listener throws', () => {
        jest.spyOn(console, 'error').mockImplementation();
        const { index } = createIndex();
        const survivor = jest.fn();
        index.subscribe(() => {
            throw new Error('listener blew up');
        });
        index.subscribe(survivor);

        expect(() => index.read(createState([a]))).not.toThrow();
        expect(survivor).toHaveBeenCalledTimes(1);
        jest.restoreAllMocks();
    });
});
