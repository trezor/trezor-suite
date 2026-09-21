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

        it('resolves to the last entity with that id', () => {
            const { index } = createIndex();

            expect(index.getById(createState([a, duplicate]), 'a')).toBe(duplicate);
        });

        it('lists the id once', () => {
            const { index } = createIndex();

            expect(index.getIds(createState([a, duplicate]))).toEqual(['a']);
        });
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

describe('leaving out the entities a list names', () => {
    const hidden = { id: 'hidden', value: 'not for the list' };
    const alsoHidden = { id: 'alsoHidden', value: 'nor this' };

    it('answers with everything the list does not name', () => {
        const { index } = createIndex();
        const state = createState([a, hidden, b]);

        expect(index.getAllExcept(state, ['hidden'])).toEqual([a, b]);
    });

    it('leaves out every id on the list', () => {
        const { index } = createIndex();
        const state = createState([a, hidden, b, alsoHidden]);

        expect(index.getAllExcept(state, ['hidden', 'alsoHidden'])).toEqual([a, b]);
    });

    it('keeps the order the index lists them in, not the order of the list', () => {
        const { index } = createIndex();
        const state = createState([b, hidden, a]);

        expect(index.getAllExcept(state, ['hidden'])).toEqual([b, a]);
    });

    it('takes the list as a set', () => {
        const { index } = createIndex();
        const state = createState([a, hidden, b]);

        expect(index.getAllExcept(state, new Set(['hidden']))).toEqual([a, b]);
    });

    it('ignores an id on the list that the index does not hold', () => {
        const { index } = createIndex();

        expect(index.getAllExcept(createState([a, b]), ['hidden'])).toEqual([a, b]);
    });

    it('answers with everything for an empty list', () => {
        const { index } = createIndex();

        expect(index.getAllExcept(createState([a, b]), [])).toEqual([a, b]);
    });

    it('answers with the shared empty array when the list names everything', () => {
        const { index } = createIndex();
        const state = createState([hidden]);

        expect(index.getAllExcept(state, ['hidden'])).toBe(
            index.getAllExcept(createState([alsoHidden]), ['alsoHidden']),
        );
    });

    it('hands back the same array while the index and the list are unchanged', () => {
        const { index } = createIndex();
        const state = createState([a, hidden, b]);
        const hiddenIds = ['hidden'];

        expect(index.getAllExcept(state, hiddenIds)).toBe(index.getAllExcept(state, hiddenIds));
    });

    it('answers a different list separately', () => {
        const { index } = createIndex();
        const state = createState([a, hidden, b]);

        expect(index.getAllExcept(state, ['hidden'])).toEqual([a, b]);
        expect(index.getAllExcept(state, ['a'])).toEqual([hidden, b]);
    });

    it('answers again when the source changed', () => {
        const { index } = createIndex();
        const hiddenIds = ['hidden'];
        const before = index.getAllExcept(createState([a, hidden]), hiddenIds);

        const after = index.getAllExcept(createState([a, hidden, b]), hiddenIds);

        expect(after).not.toBe(before);
        expect(after).toEqual([a, b]);
    });

    it('leaves out a hidden entity that was replaced', () => {
        const { index } = createIndex();
        index.getAllExcept(createState([a, hidden]), ['hidden']);

        const afterHiddenChanged = index.getAllExcept(
            createState([a, { ...hidden, value: 'written' }]),
            ['hidden'],
        );

        expect(afterHiddenChanged).toEqual([a]);
    });
});

type PartitionedState = { bySide: Record<string, Thing[]> };

const createPartitionedIndex = () => {
    const getEntities = jest.fn((things: Thing[]) => things);

    const index = createEntityIndex({
        name: 'partitionedThings',
        selectSource: (state: PartitionedState) => state.bySide,
        getPartitions: (bySide: Record<string, Thing[]>) => Object.entries(bySide),
        getEntities,
        getId: (thing: Thing) => thing.id,
    });

    return { index, getEntities };
};

describe('an index over a source that is written in partitions', () => {
    const c = { id: 'c', value: 'third' };

    it('walks only the partition that changed', () => {
        // The whole point: one account receiving a transaction costs one account's worth of work,
        // however many accounts the user has. Immer leaves the untouched partitions identical, so they
        // are carried over rather than walked.
        const { index, getEntities } = createPartitionedIndex();
        const untouched = [c];

        index.read({ bySide: { left: [a], right: untouched } });
        getEntities.mockClear();
        index.read({ bySide: { left: [a, b], right: untouched } });

        expect(getEntities).toHaveBeenCalledTimes(1);
        expect(getEntities).toHaveBeenCalledWith([a, b]);
    });

    it('still holds the entities of the partitions it did not walk', () => {
        const { index } = createPartitionedIndex();
        const untouched = [c];

        index.read({ bySide: { left: [a], right: untouched } });
        const state = { bySide: { left: [a, b], right: untouched } };

        expect(index.getById(state, 'c')).toBe(c);
        expect(index.getById(state, 'b')).toBe(b);
    });

    it('walks a partition it has not seen before', () => {
        const { index, getEntities } = createPartitionedIndex();
        const untouched = [a];

        index.read({ bySide: { left: untouched } });
        getEntities.mockClear();
        index.read({ bySide: { left: untouched, right: [c] } });

        expect(getEntities).toHaveBeenCalledTimes(1);
        expect(getEntities).toHaveBeenCalledWith([c]);
    });

    it('drops the entities of a partition the source no longer has', () => {
        const { index } = createPartitionedIndex();
        const untouched = [a];

        index.read({ bySide: { left: untouched, right: [c] } });

        expect(index.getById({ bySide: { left: untouched } }, 'c')).toBeUndefined();
    });
});

describe('what a rebuild changed', () => {
    const readChanges = (index: ReturnType<typeof createIndex>['index'], state: State) =>
        index.read(state).changes;

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

    it('does not report an entity that only moved between partitions as gone', () => {
        const { index } = createPartitionedIndex();
        index.read({ bySide: { left: [a], right: [] } });

        expect(index.read({ bySide: { left: [], right: [a] } }).changes).toEqual({
            added: [],
            removed: [],
            updated: [],
        });
    });
});

type Tagged = { id: string; side: string; tags: string[] };

const createIndexWithSecondaryIndex = () => {
    const bySide = jest.fn((entity: Tagged) => entity.side);

    const index = createEntityIndex({
        name: 'tagged',
        selectSource: (state: { entities: Tagged[] }) => state.entities,
        getEntities: (entities: Tagged[]) => entities,
        getId: (entity: Tagged) => entity.id,
        secondaryIndexes: {
            bySide,
            byTag: (entity: Tagged) => entity.tags,
        },
    });

    return { index, bySide };
};

const one = { id: '1', side: 'left', tags: ['red', 'blue'] };
const two = { id: '2', side: 'left', tags: ['red'] };
const three = { id: '3', side: 'right', tags: [] };

describe('looking an entity up by something other than its id', () => {
    it('gives the ids in an entry', () => {
        const { index } = createIndexWithSecondaryIndex();

        expect(
            index.getIdsBySecondaryKey({ entities: [one, two, three] }, 'bySide', 'left'),
        ).toEqual(['1', '2']);
    });

    it('gives nothing for a key the entry does not hold', () => {
        const { index } = createIndexWithSecondaryIndex();

        expect(index.getIdsBySecondaryKey({ entities: [one] }, 'bySide', 'nowhere')).toEqual([]);
    });

    it('puts an entity in every key it names', () => {
        // A transaction belongs to each of its target addresses, not to one of them.
        const { index } = createIndexWithSecondaryIndex();
        const state = { entities: [one, two] };

        expect(index.getIdsBySecondaryKey(state, 'byTag', 'red')).toEqual(['1', '2']);
        expect(index.getIdsBySecondaryKey(state, 'byTag', 'blue')).toEqual(['1']);
    });

    it('leaves out an entity that names no key', () => {
        const { index } = createIndexWithSecondaryIndex();

        expect(index.getIdsBySecondaryKey({ entities: [three] }, 'byTag', 'red')).toEqual([]);
    });

    it('hands back the same array for an entry whose members did not change', () => {
        // What keeps a component watching one account from re-rendering when another receives a
        // transaction.
        const { index } = createIndexWithSecondaryIndex();
        const left = index.getIdsBySecondaryKey({ entities: [one, two, three] }, 'bySide', 'left');

        const afterRightChanged = index.getIdsBySecondaryKey(
            { entities: [one, two, { ...three, tags: ['new'] }] },
            'bySide',
            'left',
        );

        expect(afterRightChanged).toBe(left);
    });

    it('hands back a new array for an entry that gained a member', () => {
        const { index } = createIndexWithSecondaryIndex();
        const left = index.getIdsBySecondaryKey({ entities: [one] }, 'bySide', 'left');

        expect(index.getIdsBySecondaryKey({ entities: [one, two] }, 'bySide', 'left')).not.toBe(
            left,
        );
    });

    it('does not ask an untouched partition for its keys again', () => {
        const { bySide } = createIndexWithSecondaryIndex();
        const untouched = [one];
        const partitioned = createEntityIndex({
            name: 'taggedPartitions',
            selectSource: (state: { bySide: Record<string, Tagged[]> }) => state.bySide,
            getPartitions: (partitions: Record<string, Tagged[]>) => Object.entries(partitions),
            getEntities: (entities: Tagged[]) => entities,
            getId: (entity: Tagged) => entity.id,
            secondaryIndexes: { bySide },
        });
        partitioned.getIdsBySecondaryKey({ bySide: { a: untouched, b: [two] } }, 'bySide', 'left');
        bySide.mockClear();
        partitioned.getIdsBySecondaryKey(
            { bySide: { a: untouched, b: [two, three] } },
            'bySide',
            'left',
        );

        // Only the rebuilt partition's entities were asked which entry they belong to.
        expect(bySide).toHaveBeenCalledTimes(2);
        expect(bySide).not.toHaveBeenCalledWith(one);
    });
});

describe('an entry nobody reads', () => {
    it('is not assembled, and its keys are never derived', () => {
        const bySide = jest.fn((entity: Tagged) => entity.side);
        const byTag = jest.fn((entity: Tagged) => entity.tags);
        const index = createEntityIndex({
            name: 'lazyIndexes',
            selectSource: (state: { entities: Tagged[] }) => state.entities,
            getEntities: (entities: Tagged[]) => entities,
            getId: (entity: Tagged) => entity.id,
            secondaryIndexes: { bySide, byTag },
        });

        index.getIdsBySecondaryKey({ entities: [one, two, three] }, 'bySide', 'left');

        expect(bySide).toHaveBeenCalledTimes(3);
        expect(byTag).not.toHaveBeenCalled();
    });

    it('derives its keys the first time it is read, and not again', () => {
        const { index, bySide } = createIndexWithSecondaryIndex();
        const state = { entities: [one, two] };

        index.getIdsBySecondaryKey(state, 'bySide', 'left');
        bySide.mockClear();
        index.getIdsBySecondaryKey(state, 'bySide', 'left');

        expect(bySide).not.toHaveBeenCalled();
    });

    it('costs nothing to the reads that do not want it', () => {
        const byTag = jest.fn((entity: Tagged) => entity.tags);
        const index = createEntityIndex({
            name: 'lazyById',
            selectSource: (state: { entities: Tagged[] }) => state.entities,
            getEntities: (entities: Tagged[]) => entities,
            getId: (entity: Tagged) => entity.id,
            secondaryIndexes: { byTag },
        });

        index.getById({ entities: [one, two] }, '1');

        expect(byTag).not.toHaveBeenCalled();
    });
});

describe('an entry whose entity changed', () => {
    it('hands back a new array, so a consumer watching it sees the change', () => {
        const { index } = createIndexWithSecondaryIndex();
        const left = index.getBySecondaryKey({ entities: [one, two, three] }, 'bySide', 'left');
        const changedTwo = { ...two, tags: ['written'] };

        const afterChange = index.getBySecondaryKey(
            { entities: [one, changedTwo, three] },
            'bySide',
            'left',
        );

        expect(afterChange).not.toBe(left);
        expect(afterChange).toEqual([one, changedTwo]);
    });

    it('says the entity was updated, so a listener knows what happened', () => {
        const { index } = createIndexWithSecondaryIndex();
        const listener = jest.fn();
        index.subscribe(listener);
        index.getBySecondaryKey({ entities: [one, two] }, 'bySide', 'left');

        index.getBySecondaryKey({ entities: [one, { ...two, side: 'left' }] }, 'bySide', 'left');

        expect(listener).toHaveBeenLastCalledWith(
            expect.objectContaining({
                changes: { added: [], removed: [], updated: ['2'] },
            }),
        );
    });

    it('keeps the array of the entry the changed entity is not in', () => {
        const { index } = createIndexWithSecondaryIndex();
        const right = index.getBySecondaryKey({ entities: [one, two, three] }, 'bySide', 'right');

        const afterLeftChanged = index.getBySecondaryKey(
            { entities: [one, { ...two, tags: ['written'] }, three] },
            'bySide',
            'right',
        );

        expect(afterLeftChanged).toBe(right);
    });
});

describe('the secondary indexes a consumer keeps reading', () => {
    const createTwoIndexEntityIndex = () => {
        const bySide = jest.fn((entity: Tagged) => entity.side);
        const byTag = jest.fn((entity: Tagged) => entity.tags);

        return {
            bySide,
            byTag,
            index: createEntityIndex({
                name: 'twoIndexes',
                selectSource: (state: { entities: Tagged[] }) => state.entities,
                getEntities: (entities: Tagged[]) => entities,
                getId: (entity: Tagged) => entity.id,
                secondaryIndexes: { bySide, byTag },
            }),
        };
    };

    it('are assembled together, in the walk the next build is doing anyway', () => {
        const { index, byTag } = createTwoIndexEntityIndex();
        index.getIdsBySecondaryKey({ entities: [one] }, 'bySide', 'left');
        index.getIdsBySecondaryKey({ entities: [one] }, 'byTag', 'red');
        byTag.mockClear();

        index.getIdsBySecondaryKey({ entities: [one, two] }, 'bySide', 'left');

        expect(byTag).toHaveBeenCalled();
    });

    it('stop being assembled once nobody reads them', () => {
        const { index, byTag } = createTwoIndexEntityIndex();
        index.getIdsBySecondaryKey({ entities: [one] }, 'bySide', 'left');
        index.getIdsBySecondaryKey({ entities: [one] }, 'byTag', 'red');
        index.getIdsBySecondaryKey({ entities: [one, two] }, 'bySide', 'left');
        byTag.mockClear();

        index.getIdsBySecondaryKey({ entities: [one, two, three] }, 'bySide', 'left');

        expect(byTag).not.toHaveBeenCalled();
    });
});

describe('an entry settled against the partition that was written', () => {
    type Partitioned = { byPartition: Record<string, Tagged[]> };

    const createSettledIndex = () =>
        createEntityIndex({
            name: 'settledIndexes',
            selectSource: (state: Partitioned) => state.byPartition,
            getPartitions: (byPartition: Record<string, Tagged[]>) => Object.entries(byPartition),
            getEntities: (entities: Tagged[]) => entities,
            getId: (entity: Tagged) => entity.id,
            secondaryIndexes: { bySide: (entity: Tagged) => entity.side },
        });

    it('keeps the array of a key no written partition had a hand in', () => {
        const index = createSettledIndex();
        const untouched = [one, two];
        const left = index.getBySecondaryKey(
            { byPartition: { a: untouched, b: [three] } },
            'bySide',
            'left',
        );

        const afterOtherPartWritten = index.getBySecondaryKey(
            { byPartition: { a: untouched, b: [three, { ...three, id: '4' }] } },
            'bySide',
            'left',
        );

        expect(afterOtherPartWritten).toBe(left);
    });

    it('keeps the array of a key the written partition left alone', () => {
        const index = createSettledIndex();
        const right = index.getBySecondaryKey(
            { byPartition: { a: [one], b: [three] } },
            'bySide',
            'right',
        );

        const afterWriteToTheSamePart = index.getBySecondaryKey(
            { byPartition: { a: [one, two], b: [three] } },
            'bySide',
            'right',
        );

        expect(afterWriteToTheSamePart).toBe(right);
    });

    it('drops a member a vanished partition had put in a shared key', () => {
        const index = createSettledIndex();

        index.getBySecondaryKey({ byPartition: { a: [one], b: [two] } }, 'bySide', 'left');

        expect(index.getBySecondaryKey({ byPartition: { a: [one] } }, 'bySide', 'left')).toEqual([
            one,
        ]);
    });

    it('drops a key a vanished partition held alone', () => {
        const index = createSettledIndex();

        index.getBySecondaryKey({ byPartition: { a: [one], b: [three] } }, 'bySide', 'right');

        expect(index.getBySecondaryKey({ byPartition: { a: [one] } }, 'bySide', 'right')).toEqual(
            [],
        );
    });

    it('orders an entry by the partitions, however they are reordered', () => {
        const index = createSettledIndex();

        index.getBySecondaryKey({ byPartition: { a: [one], b: [two] } }, 'bySide', 'left');

        expect(
            index.getBySecondaryKey({ byPartition: { b: [two], a: [one] } }, 'bySide', 'left'),
        ).toEqual([two, one]);
    });
});

describe('reading an entry as entities', () => {
    it('gives the entities in an entry', () => {
        const { index } = createIndexWithSecondaryIndex();

        expect(index.getBySecondaryKey({ entities: [one, two, three] }, 'bySide', 'left')).toEqual([
            one,
            two,
        ]);
    });

    it('gives nothing for a key the entry does not hold', () => {
        const { index } = createIndexWithSecondaryIndex();

        expect(index.getBySecondaryKey({ entities: [one] }, 'bySide', 'nowhere')).toEqual([]);
    });

    it('hands back the same array for an entry whose members did not change', () => {
        const { index } = createIndexWithSecondaryIndex();
        const left = index.getBySecondaryKey({ entities: [one, two, three] }, 'bySide', 'left');

        expect(
            index.getBySecondaryKey(
                { entities: [one, two, { ...three, tags: ['new'] }] },
                'bySide',
                'left',
            ),
        ).toBe(left);
    });

    it('hands back a new array when a member of the entry was replaced', () => {
        // The ids did not change, but the entities did — which a consumer reading entities has to
        // see, and a consumer reading ids has no reason to be woken by.
        const { index } = createIndexWithSecondaryIndex();
        const left = index.getBySecondaryKey({ entities: [one, two] }, 'bySide', 'left');
        const state = { entities: [{ ...one, tags: ['changed'] }, two] };

        expect(index.getBySecondaryKey(state, 'bySide', 'left')).not.toBe(left);
        expect(index.getIdsBySecondaryKey(state, 'bySide', 'left')).toEqual(['1', '2']);
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
        expect(listener.mock.calls[0]?.[0].changes).toEqual({
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

describe('an entry keeping up with what happened to its entities', () => {
    it('takes an entity out of the entry it left and puts it in the one it joined', () => {
        // The generic case transactions cannot reach: an entity whose entry key changed.
        const { index } = createIndexWithSecondaryIndex();
        index.read({ entities: [one, two] });
        const moved = { ...one, side: 'right' };

        const state = { entities: [moved, two] };

        expect(index.getIdsBySecondaryKey(state, 'bySide', 'left')).toEqual(['2']);
        expect(index.getIdsBySecondaryKey(state, 'bySide', 'right')).toEqual(['1']);
        expect(index.getBySecondaryKey(state, 'bySide', 'right')).toEqual([moved]);
    });

    it('empties an entry whose last member left it', () => {
        const { index } = createIndexWithSecondaryIndex();
        index.read({ entities: [one] });

        expect(
            index.getIdsBySecondaryKey({ entities: [{ ...one, side: 'right' }] }, 'bySide', 'left'),
        ).toEqual([]);
    });

    it('empties an entry whose last member was removed', () => {
        const { index } = createIndexWithSecondaryIndex();
        index.read({ entities: [one, three] });

        expect(index.getIdsBySecondaryKey({ entities: [three] }, 'bySide', 'left')).toEqual([]);
    });

    it('opens an entry for a key nothing had before', () => {
        const { index } = createIndexWithSecondaryIndex();
        index.read({ entities: [one] });
        const arrived = { id: '9', side: 'elsewhere', tags: [] };

        expect(
            index.getIdsBySecondaryKey({ entities: [one, arrived] }, 'bySide', 'elsewhere'),
        ).toEqual(['9']);
    });

    it('follows an entity that changed which keys it names', () => {
        // Multi-key entries: the entity has to leave every key it no longer names.
        const { index } = createIndexWithSecondaryIndex();
        index.read({ entities: [one] });
        const retagged = { ...one, tags: ['green'] };

        const state = { entities: [retagged] };

        expect(index.getIdsBySecondaryKey(state, 'byTag', 'red')).toEqual([]);
        expect(index.getIdsBySecondaryKey(state, 'byTag', 'blue')).toEqual([]);
        expect(index.getIdsBySecondaryKey(state, 'byTag', 'green')).toEqual(['1']);
    });

    it('empties every entry when the last entity goes', () => {
        const { index } = createIndexWithSecondaryIndex();
        index.read({ entities: [one, two, three] });

        const state = { entities: [] };

        expect(index.getIdsBySecondaryKey(state, 'bySide', 'left')).toEqual([]);
        expect(index.getIdsBySecondaryKey(state, 'byTag', 'red')).toEqual([]);
        expect(index.getIds(state)).toEqual([]);
    });

    it('keeps the ids array and replaces the entities array when a member was updated', () => {
        const { index } = createIndexWithSecondaryIndex();
        const before = { entities: [one, two] };
        const previousIds = index.getIdsBySecondaryKey(before, 'bySide', 'left');
        const previousEntities = index.getBySecondaryKey(before, 'bySide', 'left');

        const state = { entities: [{ ...one, tags: ['changed'] }, two] };

        expect(index.getIdsBySecondaryKey(state, 'bySide', 'left')).toEqual(previousIds);
        expect(index.getBySecondaryKey(state, 'bySide', 'left')).not.toBe(previousEntities);
    });
});

describe('an entity that names the same entry key more than once', () => {
    it('is in that entry once', () => {
        // A transaction paying an address both from an input and to a target names it twice, and
        // belongs to the address once.
        const { index } = createIndexWithSecondaryIndex();
        const twice = { id: '1', side: 'left', tags: ['red', 'red'] };

        expect(index.getIdsBySecondaryKey({ entities: [twice] }, 'byTag', 'red')).toEqual(['1']);
        expect(index.getBySecondaryKey({ entities: [twice] }, 'byTag', 'red')).toEqual([twice]);
    });

    it('does not swallow a different entity that names the same key', () => {
        const { index } = createIndexWithSecondaryIndex();
        const first = { id: '1', side: 'left', tags: ['red', 'red'] };
        const second = { id: '2', side: 'left', tags: ['red'] };

        expect(index.getIdsBySecondaryKey({ entities: [first, second] }, 'byTag', 'red')).toEqual([
            '1',
            '2',
        ]);
    });
});
