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

describe('createEntityIndex', () => {
    it('builds nothing until it is read', () => {
        const { index, getEntities } = createIndex();
        index.subscribe();

        expect(getEntities).not.toHaveBeenCalled();
    });

    it('finds an entity by its id', () => {
        const { index } = createIndex();
        const state = createState([a, b]);

        expect(index.selectById(state, 'b')).toBe(b);
    });

    it('answers with nothing for an id it does not hold', () => {
        const { index } = createIndex();

        expect(index.selectById(createState([a]), 'b')).toBeUndefined();
    });

    it('lists ids in the order the source yields them', () => {
        const { index } = createIndex();

        expect(index.selectIds(createState([b, a]))).toEqual(['b', 'a']);
    });

    describe('while subscribed', () => {
        it('builds once for repeated reads of an unchanged source', () => {
            // The point of the index: a re-render that changed nothing else costs one comparison.
            const { index, getEntities } = createIndex();
            index.subscribe();
            const state = createState([a, b]);

            index.read(state);
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(1);
        });

        it('hands back the same snapshot, so consumers can compare by reference', () => {
            const { index } = createIndex();
            index.subscribe();
            const state = createState([a, b]);

            expect(index.read(state)).toBe(index.read(state));
        });

        it('builds once for two consumers of the same index', () => {
            // Two screens asking the same question in one render pass are one build, not two.
            const { index, getEntities } = createIndex();
            index.subscribe();
            index.subscribe();
            const state = createState([a, b]);

            index.read(state);
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(1);
        });

        it('rebuilds when the source is replaced', () => {
            const { index } = createIndex();
            index.subscribe();
            const updated = { ...b, value: 'changed' };

            expect(index.selectById(createState([a, b]), 'b')).toBe(b);
            expect(index.selectById(createState([a, updated]), 'b')).toBe(updated);
        });

        it('does not rebuild for a state object that kept the same source', () => {
            // Reducers other than this one write on every action; those writes must not cost a
            // rebuild here.
            const { index, getEntities } = createIndex();
            index.subscribe();
            const things = [a, b];

            index.read({ things });
            index.read({ things });

            expect(getEntities).toHaveBeenCalledTimes(1);
        });
    });

    describe('while nobody is subscribed', () => {
        it('still answers correctly', () => {
            const { index } = createIndex();

            expect(index.selectById(createState([a]), 'a')).toBe(a);
        });

        it('still builds once for repeated reads of an unchanged source', () => {
            // A list of a hundred rows reads the index a hundred times on its first render,
            // before a single subscription effect has run. Those are one build.
            const { index, getEntities } = createIndex();
            const state = createState([a, b]);

            index.read(state);
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(1);
        });

        it('drops what it held once the last subscriber leaves', () => {
            const { index, getEntities } = createIndex();
            const unsubscribe = index.subscribe();
            const state = createState([a, b]);

            index.read(state);
            unsubscribe();
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(2);
        });

        it('keeps holding while any subscriber remains', () => {
            const { index, getEntities } = createIndex();
            const unsubscribe = index.subscribe();
            index.subscribe();
            const state = createState([a, b]);

            index.read(state);
            unsubscribe();
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(1);
        });

        it('ignores a consumer unsubscribing twice', () => {
            // Otherwise one sloppy consumer releases a build another one is still holding.
            const { index, getEntities } = createIndex();
            const unsubscribe = index.subscribe();
            index.subscribe();
            unsubscribe();
            unsubscribe();
            const state = createState([a, b]);

            index.read(state);
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(1);
            expect(index.getSubscriberCount()).toBe(1);
        });
    });

    describe('ids that repeat', () => {
        const duplicate = { id: 'a', value: 'also first' };

        it('resolves to the last entity with that id', () => {
            const { index } = createIndex();

            expect(index.selectById(createState([a, duplicate]), 'a')).toBe(duplicate);
        });

        it('lists the id once', () => {
            const { index } = createIndex();

            expect(index.selectIds(createState([a, duplicate]))).toEqual(['a']);
        });
    });

    it('shares one empty snapshot, so an empty index is stable across sources', () => {
        const { index } = createIndex();

        expect(index.read(createState([]))).toBe(index.read(createState([])));
    });
});

type PartitionedState = { byGroup: Record<string, Thing[]> };

const createPartitionedIndex = () => {
    const getEntities = jest.fn((things: Thing[]) => things);

    const index = createEntityIndex({
        name: 'partitionedThings',
        selectSource: (state: PartitionedState) => state.byGroup,
        getParts: (byGroup: Record<string, Thing[]>) => Object.entries(byGroup),
        getEntities,
        getId: (thing: Thing) => thing.id,
    });

    return { index, getEntities };
};

describe('an index over a source that is written in parts', () => {
    const c = { id: 'c', value: 'third' };

    it('walks only the part that changed', () => {
        // The whole point: one account receiving a transaction costs one account's worth of work,
        // however many accounts the user has. Immer leaves the untouched parts identical, so they
        // are carried over rather than walked.
        const { index, getEntities } = createPartitionedIndex();
        const untouched = [c];
        index.subscribe();

        index.read({ byGroup: { left: [a], right: untouched } });
        getEntities.mockClear();
        index.read({ byGroup: { left: [a, b], right: untouched } });

        expect(getEntities).toHaveBeenCalledTimes(1);
        expect(getEntities).toHaveBeenCalledWith([a, b]);
    });

    it('still holds the entities of the parts it did not walk', () => {
        const { index } = createPartitionedIndex();
        const untouched = [c];
        index.subscribe();

        index.read({ byGroup: { left: [a], right: untouched } });
        const state = { byGroup: { left: [a, b], right: untouched } };

        expect(index.selectById(state, 'c')).toBe(c);
        expect(index.selectById(state, 'b')).toBe(b);
    });

    it('walks a part it has not seen before', () => {
        const { index, getEntities } = createPartitionedIndex();
        const untouched = [a];
        index.subscribe();

        index.read({ byGroup: { left: untouched } });
        getEntities.mockClear();
        index.read({ byGroup: { left: untouched, right: [c] } });

        expect(getEntities).toHaveBeenCalledTimes(1);
        expect(getEntities).toHaveBeenCalledWith([c]);
    });

    it('drops the entities of a part the source no longer has', () => {
        const { index } = createPartitionedIndex();
        const untouched = [a];
        index.subscribe();

        index.read({ byGroup: { left: untouched, right: [c] } });

        expect(index.selectById({ byGroup: { left: untouched } }, 'c')).toBeUndefined();
    });
});

describe('what a rebuild changed', () => {
    const readChanges = (index: ReturnType<typeof createIndex>['index'], state: State) =>
        index.read(state).changes;

    it('is nothing on the first build, which nobody can have missed', () => {
        const { index } = createIndex();
        index.subscribe();

        expect(readChanges(index, createState([a, b]))).toEqual({
            added: [],
            removed: [],
            updated: [],
        });
    });

    it('reports an entity that arrived', () => {
        const { index } = createIndex();
        index.subscribe();
        index.read(createState([a]));

        expect(readChanges(index, createState([a, b]))).toEqual({
            added: ['b'],
            removed: [],
            updated: [],
        });
    });

    it('reports an entity that went away', () => {
        const { index } = createIndex();
        index.subscribe();
        index.read(createState([a, b]));

        expect(readChanges(index, createState([a]))).toEqual({
            added: [],
            removed: ['b'],
            updated: [],
        });
    });

    it('reports an entity that is a different object than it was', () => {
        const { index } = createIndex();
        index.subscribe();
        index.read(createState([a, b]));

        expect(readChanges(index, createState([a, { ...b, value: 'changed' }]))).toEqual({
            added: [],
            removed: [],
            updated: ['b'],
        });
    });

    it('says nothing about an entity that is the same object as before', () => {
        const { index } = createIndex();
        index.subscribe();
        index.read(createState([a, b]));

        // `a` is carried across untouched, so it is in none of the three lists.
        expect(readChanges(index, createState([a, { ...b, value: 'changed' }])).updated).toEqual([
            'b',
        ]);
    });

    it('does not report an entity that only moved between parts as gone', () => {
        const { index } = createPartitionedIndex();
        index.subscribe();
        index.read({ byGroup: { left: [a], right: [] } });

        expect(index.read({ byGroup: { left: [], right: [a] } }).changes).toEqual({
            added: [],
            removed: [],
            updated: [],
        });
    });
});
