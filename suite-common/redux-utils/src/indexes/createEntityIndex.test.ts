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
            groupBy: { byValue: (thing: Thing) => thing.value },
        });

    it('takes the source for the entities when it is not told how to read them', () => {
        const index = createBareIndex();

        expect(index.getById(createState([a, b]), 'b')).toBe(b);
    });

    it('lists them in the order the source holds them', () => {
        const index = createBareIndex();

        expect(index.getIds(createState([b, a]))).toEqual(['b', 'a']);
    });

    it('groups them', () => {
        const index = createBareIndex();

        expect(index.getBy(createState([a, b]), 'byValue', 'second')).toEqual([b]);
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
});

describe('leaving out the entities a list names', () => {
    const hidden = { id: 'hidden', value: 'not for the list' };
    const alsoHidden = { id: 'alsoHidden', value: 'nor this' };

    it('answers with everything the list does not name', () => {
        const { index } = createIndex();
        const state = createState([a, hidden, b]);

        expect(index.getInverseOfIds(state, ['hidden'])).toEqual([a, b]);
    });

    it('leaves out every id on the list', () => {
        const { index } = createIndex();
        const state = createState([a, hidden, b, alsoHidden]);

        expect(index.getInverseOfIds(state, ['hidden', 'alsoHidden'])).toEqual([a, b]);
    });

    it('keeps the order the index lists them in, not the order of the list', () => {
        const { index } = createIndex();
        const state = createState([b, hidden, a]);

        expect(index.getInverseOfIds(state, ['hidden'])).toEqual([b, a]);
    });

    it('takes the list as a set', () => {
        const { index } = createIndex();
        const state = createState([a, hidden, b]);

        expect(index.getInverseOfIds(state, new Set(['hidden']))).toEqual([a, b]);
    });

    it('ignores an id on the list that the index does not hold', () => {
        const { index } = createIndex();

        expect(index.getInverseOfIds(createState([a, b]), ['hidden'])).toEqual([a, b]);
    });

    it('answers with everything for an empty list', () => {
        const { index } = createIndex();

        expect(index.getInverseOfIds(createState([a, b]), [])).toEqual([a, b]);
    });

    it('answers with the shared empty array when the list names everything', () => {
        const { index } = createIndex();
        const state = createState([hidden]);

        expect(index.getInverseOfIds(state, ['hidden'])).toBe(
            index.getInverseOfIds(createState([alsoHidden]), ['alsoHidden']),
        );
    });

    it('hands back the same array while the index and the list are unchanged', () => {
        const { index } = createIndex();
        const state = createState([a, hidden, b]);
        const hiddenIds = ['hidden'];

        expect(index.getInverseOfIds(state, hiddenIds)).toBe(
            index.getInverseOfIds(state, hiddenIds),
        );
    });

    it('answers a different list separately', () => {
        const { index } = createIndex();
        const state = createState([a, hidden, b]);

        expect(index.getInverseOfIds(state, ['hidden'])).toEqual([a, b]);
        expect(index.getInverseOfIds(state, ['a'])).toEqual([hidden, b]);
    });

    it('answers again when the source changed', () => {
        const { index } = createIndex();
        const hiddenIds = ['hidden'];
        const before = index.getInverseOfIds(createState([a, hidden]), hiddenIds);

        const after = index.getInverseOfIds(createState([a, hidden, b]), hiddenIds);

        expect(after).not.toBe(before);
        expect(after).toEqual([a, b]);
    });

    it('leaves out a hidden entity that was replaced', () => {
        const { index } = createIndex();
        index.getInverseOfIds(createState([a, hidden]), ['hidden']);

        const afterHiddenChanged = index.getInverseOfIds(
            createState([a, { ...hidden, value: 'written' }]),
            ['hidden'],
        );

        expect(afterHiddenChanged).toEqual([a]);
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

        index.read({ byGroup: { left: [a], right: untouched } });
        getEntities.mockClear();
        index.read({ byGroup: { left: [a, b], right: untouched } });

        expect(getEntities).toHaveBeenCalledTimes(1);
        expect(getEntities).toHaveBeenCalledWith([a, b]);
    });

    it('still holds the entities of the parts it did not walk', () => {
        const { index } = createPartitionedIndex();
        const untouched = [c];

        index.read({ byGroup: { left: [a], right: untouched } });
        const state = { byGroup: { left: [a, b], right: untouched } };

        expect(index.getById(state, 'c')).toBe(c);
        expect(index.getById(state, 'b')).toBe(b);
    });

    it('walks a part it has not seen before', () => {
        const { index, getEntities } = createPartitionedIndex();
        const untouched = [a];

        index.read({ byGroup: { left: untouched } });
        getEntities.mockClear();
        index.read({ byGroup: { left: untouched, right: [c] } });

        expect(getEntities).toHaveBeenCalledTimes(1);
        expect(getEntities).toHaveBeenCalledWith([c]);
    });

    it('drops the entities of a part the source no longer has', () => {
        const { index } = createPartitionedIndex();
        const untouched = [a];

        index.read({ byGroup: { left: untouched, right: [c] } });

        expect(index.getById({ byGroup: { left: untouched } }, 'c')).toBeUndefined();
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

    it('does not report an entity that only moved between parts as gone', () => {
        const { index } = createPartitionedIndex();
        index.read({ byGroup: { left: [a], right: [] } });

        expect(index.read({ byGroup: { left: [], right: [a] } }).changes).toEqual({
            added: [],
            removed: [],
            updated: [],
        });
    });
});

type Grouped = { id: string; group: string; tags: string[] };

const createGroupedIndex = () => {
    const byGroup = jest.fn((entity: Grouped) => entity.group);

    const index = createEntityIndex({
        name: 'grouped',
        selectSource: (state: { entities: Grouped[] }) => state.entities,
        getEntities: (entities: Grouped[]) => entities,
        getId: (entity: Grouped) => entity.id,
        groupBy: {
            byGroup,
            byTag: (entity: Grouped) => entity.tags,
        },
    });

    return { index, byGroup };
};

const one = { id: '1', group: 'left', tags: ['red', 'blue'] };
const two = { id: '2', group: 'left', tags: ['red'] };
const three = { id: '3', group: 'right', tags: [] };

describe('looking an entity up by something other than its id', () => {
    it('gives the ids in a group', () => {
        const { index } = createGroupedIndex();

        expect(index.getIdsBy({ entities: [one, two, three] }, 'byGroup', 'left')).toEqual([
            '1',
            '2',
        ]);
    });

    it('gives nothing for a key the group does not hold', () => {
        const { index } = createGroupedIndex();

        expect(index.getIdsBy({ entities: [one] }, 'byGroup', 'nowhere')).toEqual([]);
    });

    it('puts an entity in every key it names', () => {
        // A transaction belongs to each of its target addresses, not to one of them.
        const { index } = createGroupedIndex();
        const state = { entities: [one, two] };

        expect(index.getIdsBy(state, 'byTag', 'red')).toEqual(['1', '2']);
        expect(index.getIdsBy(state, 'byTag', 'blue')).toEqual(['1']);
    });

    it('leaves out an entity that names no key', () => {
        const { index } = createGroupedIndex();

        expect(index.getIdsBy({ entities: [three] }, 'byTag', 'red')).toEqual([]);
    });

    it('hands back the same array for a group whose members did not change', () => {
        // What keeps a component watching one account from re-rendering when another receives a
        // transaction.
        const { index } = createGroupedIndex();
        const left = index.getIdsBy({ entities: [one, two, three] }, 'byGroup', 'left');

        const afterRightChanged = index.getIdsBy(
            { entities: [one, two, { ...three, tags: ['new'] }] },
            'byGroup',
            'left',
        );

        expect(afterRightChanged).toBe(left);
    });

    it('hands back a new array for a group that gained a member', () => {
        const { index } = createGroupedIndex();
        const left = index.getIdsBy({ entities: [one] }, 'byGroup', 'left');

        expect(index.getIdsBy({ entities: [one, two] }, 'byGroup', 'left')).not.toBe(left);
    });

    it('does not ask an untouched part for its keys again', () => {
        const { byGroup } = createGroupedIndex();
        const untouched = [one];
        const partitioned = createEntityIndex({
            name: 'groupedParts',
            selectSource: (state: { byGroup: Record<string, Grouped[]> }) => state.byGroup,
            getParts: (groups: Record<string, Grouped[]>) => Object.entries(groups),
            getEntities: (entities: Grouped[]) => entities,
            getId: (entity: Grouped) => entity.id,
            groupBy: { byGroup },
        });
        partitioned.getIdsBy({ byGroup: { a: untouched, b: [two] } }, 'byGroup', 'left');
        byGroup.mockClear();
        partitioned.getIdsBy({ byGroup: { a: untouched, b: [two, three] } }, 'byGroup', 'left');

        // Only the rebuilt part's entities were asked which group they belong to.
        expect(byGroup).toHaveBeenCalledTimes(2);
        expect(byGroup).not.toHaveBeenCalledWith(one);
    });
});

describe('a group nobody reads', () => {
    it('is not assembled, and its keys are never derived', () => {
        const byGroup = jest.fn((entity: Grouped) => entity.group);
        const byTag = jest.fn((entity: Grouped) => entity.tags);
        const index = createEntityIndex({
            name: 'lazyGroups',
            selectSource: (state: { entities: Grouped[] }) => state.entities,
            getEntities: (entities: Grouped[]) => entities,
            getId: (entity: Grouped) => entity.id,
            groupBy: { byGroup, byTag },
        });

        index.getIdsBy({ entities: [one, two, three] }, 'byGroup', 'left');

        expect(byGroup).toHaveBeenCalledTimes(3);
        expect(byTag).not.toHaveBeenCalled();
    });

    it('derives its keys the first time it is read, and not again', () => {
        const { index, byGroup } = createGroupedIndex();
        const state = { entities: [one, two] };

        index.getIdsBy(state, 'byGroup', 'left');
        byGroup.mockClear();
        index.getIdsBy(state, 'byGroup', 'left');

        expect(byGroup).not.toHaveBeenCalled();
    });

    it('costs nothing to the reads that do not want it', () => {
        const byTag = jest.fn((entity: Grouped) => entity.tags);
        const index = createEntityIndex({
            name: 'lazyById',
            selectSource: (state: { entities: Grouped[] }) => state.entities,
            getEntities: (entities: Grouped[]) => entities,
            getId: (entity: Grouped) => entity.id,
            groupBy: { byTag },
        });

        index.getById({ entities: [one, two] }, '1');

        expect(byTag).not.toHaveBeenCalled();
    });
});

describe('a group whose entity changed', () => {
    it('hands back a new array, so a consumer watching it sees the change', () => {
        const { index } = createGroupedIndex();
        const left = index.getBy({ entities: [one, two, three] }, 'byGroup', 'left');
        const changedTwo = { ...two, tags: ['written'] };

        const afterChange = index.getBy({ entities: [one, changedTwo, three] }, 'byGroup', 'left');

        expect(afterChange).not.toBe(left);
        expect(afterChange).toEqual([one, changedTwo]);
    });

    it('says the entity was updated, so a listener knows what happened', () => {
        const { index } = createGroupedIndex();
        const listener = jest.fn();
        index.subscribe(listener);
        index.getBy({ entities: [one, two] }, 'byGroup', 'left');

        index.getBy({ entities: [one, { ...two, group: 'left' }] }, 'byGroup', 'left');

        expect(listener).toHaveBeenLastCalledWith(
            expect.objectContaining({
                changes: { added: [], removed: [], updated: ['2'] },
            }),
        );
    });

    it('keeps the array of the group the changed entity is not in', () => {
        const { index } = createGroupedIndex();
        const right = index.getBy({ entities: [one, two, three] }, 'byGroup', 'right');

        const afterLeftChanged = index.getBy(
            { entities: [one, { ...two, tags: ['written'] }, three] },
            'byGroup',
            'right',
        );

        expect(afterLeftChanged).toBe(right);
    });
});

describe('the groups a consumer keeps reading', () => {
    const createTwoGroupIndex = () => {
        const byGroup = jest.fn((entity: Grouped) => entity.group);
        const byTag = jest.fn((entity: Grouped) => entity.tags);

        return {
            byGroup,
            byTag,
            index: createEntityIndex({
                name: 'twoGroups',
                selectSource: (state: { entities: Grouped[] }) => state.entities,
                getEntities: (entities: Grouped[]) => entities,
                getId: (entity: Grouped) => entity.id,
                groupBy: { byGroup, byTag },
            }),
        };
    };

    it('are assembled together, in the walk the next build is doing anyway', () => {
        const { index, byTag } = createTwoGroupIndex();
        index.getIdsBy({ entities: [one] }, 'byGroup', 'left');
        index.getIdsBy({ entities: [one] }, 'byTag', 'red');
        byTag.mockClear();

        index.getIdsBy({ entities: [one, two] }, 'byGroup', 'left');

        expect(byTag).toHaveBeenCalled();
    });

    it('stop being assembled once nobody reads them', () => {
        const { index, byTag } = createTwoGroupIndex();
        index.getIdsBy({ entities: [one] }, 'byGroup', 'left');
        index.getIdsBy({ entities: [one] }, 'byTag', 'red');
        index.getIdsBy({ entities: [one, two] }, 'byGroup', 'left');
        byTag.mockClear();

        index.getIdsBy({ entities: [one, two, three] }, 'byGroup', 'left');

        expect(byTag).not.toHaveBeenCalled();
    });
});

describe('a group settled against the part that was written', () => {
    type Partitioned = { byPart: Record<string, Grouped[]> };

    const createPartitionedGroupIndex = () =>
        createEntityIndex({
            name: 'settledGroups',
            selectSource: (state: Partitioned) => state.byPart,
            getParts: (byPart: Record<string, Grouped[]>) => Object.entries(byPart),
            getEntities: (entities: Grouped[]) => entities,
            getId: (entity: Grouped) => entity.id,
            groupBy: { byGroup: (entity: Grouped) => entity.group },
        });

    it('keeps the array of a key no written part had a hand in', () => {
        const index = createPartitionedGroupIndex();
        const untouched = [one, two];
        const left = index.getBy({ byPart: { a: untouched, b: [three] } }, 'byGroup', 'left');

        const afterOtherPartWritten = index.getBy(
            { byPart: { a: untouched, b: [three, { ...three, id: '4' }] } },
            'byGroup',
            'left',
        );

        expect(afterOtherPartWritten).toBe(left);
    });

    it('keeps the array of a key the written part left alone', () => {
        const index = createPartitionedGroupIndex();
        const right = index.getBy({ byPart: { a: [one], b: [three] } }, 'byGroup', 'right');

        const afterWriteToTheSamePart = index.getBy(
            { byPart: { a: [one, two], b: [three] } },
            'byGroup',
            'right',
        );

        expect(afterWriteToTheSamePart).toBe(right);
    });

    it('drops a member a vanished part had put in a shared key', () => {
        const index = createPartitionedGroupIndex();

        index.getBy({ byPart: { a: [one], b: [two] } }, 'byGroup', 'left');

        expect(index.getBy({ byPart: { a: [one] } }, 'byGroup', 'left')).toEqual([one]);
    });

    it('drops a key a vanished part held alone', () => {
        const index = createPartitionedGroupIndex();

        index.getBy({ byPart: { a: [one], b: [three] } }, 'byGroup', 'right');

        expect(index.getBy({ byPart: { a: [one] } }, 'byGroup', 'right')).toEqual([]);
    });

    it('orders a group by the parts, however they are reordered', () => {
        const index = createPartitionedGroupIndex();

        index.getBy({ byPart: { a: [one], b: [two] } }, 'byGroup', 'left');

        expect(index.getBy({ byPart: { b: [two], a: [one] } }, 'byGroup', 'left')).toEqual([
            two,
            one,
        ]);
    });
});

describe('reading a group as entities', () => {
    it('gives the entities in a group', () => {
        const { index } = createGroupedIndex();

        expect(index.getBy({ entities: [one, two, three] }, 'byGroup', 'left')).toEqual([one, two]);
    });

    it('gives nothing for a key the group does not hold', () => {
        const { index } = createGroupedIndex();

        expect(index.getBy({ entities: [one] }, 'byGroup', 'nowhere')).toEqual([]);
    });

    it('hands back the same array for a group whose members did not change', () => {
        const { index } = createGroupedIndex();
        const left = index.getBy({ entities: [one, two, three] }, 'byGroup', 'left');

        expect(
            index.getBy({ entities: [one, two, { ...three, tags: ['new'] }] }, 'byGroup', 'left'),
        ).toBe(left);
    });

    it('hands back a new array when a member of the group was replaced', () => {
        // The ids did not change, but the entities did — which a consumer reading entities has to
        // see, and a consumer reading ids has no reason to be woken by.
        const { index } = createGroupedIndex();
        const left = index.getBy({ entities: [one, two] }, 'byGroup', 'left');
        const state = { entities: [{ ...one, tags: ['changed'] }, two] };

        expect(index.getBy(state, 'byGroup', 'left')).not.toBe(left);
        expect(index.getIdsBy(state, 'byGroup', 'left')).toEqual(['1', '2']);
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

describe('a group keeping up with what happened to its entities', () => {
    it('takes an entity out of the group it left and puts it in the one it joined', () => {
        // The generic case transactions cannot reach: an entity whose group key changed.
        const { index } = createGroupedIndex();
        index.read({ entities: [one, two] });
        const moved = { ...one, group: 'right' };

        const state = { entities: [moved, two] };

        expect(index.getIdsBy(state, 'byGroup', 'left')).toEqual(['2']);
        expect(index.getIdsBy(state, 'byGroup', 'right')).toEqual(['1']);
        expect(index.getBy(state, 'byGroup', 'right')).toEqual([moved]);
    });

    it('empties a group whose last member left it', () => {
        const { index } = createGroupedIndex();
        index.read({ entities: [one] });

        expect(
            index.getIdsBy({ entities: [{ ...one, group: 'right' }] }, 'byGroup', 'left'),
        ).toEqual([]);
    });

    it('empties a group whose last member was removed', () => {
        const { index } = createGroupedIndex();
        index.read({ entities: [one, three] });

        expect(index.getIdsBy({ entities: [three] }, 'byGroup', 'left')).toEqual([]);
    });

    it('opens a group for a key nothing had before', () => {
        const { index } = createGroupedIndex();
        index.read({ entities: [one] });
        const arrived = { id: '9', group: 'elsewhere', tags: [] };

        expect(index.getIdsBy({ entities: [one, arrived] }, 'byGroup', 'elsewhere')).toEqual(['9']);
    });

    it('follows an entity that changed which keys it names', () => {
        // Multi-key groups: the entity has to leave every key it no longer names.
        const { index } = createGroupedIndex();
        index.read({ entities: [one] });
        const retagged = { ...one, tags: ['green'] };

        const state = { entities: [retagged] };

        expect(index.getIdsBy(state, 'byTag', 'red')).toEqual([]);
        expect(index.getIdsBy(state, 'byTag', 'blue')).toEqual([]);
        expect(index.getIdsBy(state, 'byTag', 'green')).toEqual(['1']);
    });

    it('empties every group when the last entity goes', () => {
        const { index } = createGroupedIndex();
        index.read({ entities: [one, two, three] });

        const state = { entities: [] };

        expect(index.getIdsBy(state, 'byGroup', 'left')).toEqual([]);
        expect(index.getIdsBy(state, 'byTag', 'red')).toEqual([]);
        expect(index.getIds(state)).toEqual([]);
    });

    it('keeps the ids array and replaces the entities array when a member was updated', () => {
        const { index } = createGroupedIndex();
        const before = { entities: [one, two] };
        const previousIds = index.getIdsBy(before, 'byGroup', 'left');
        const previousEntities = index.getBy(before, 'byGroup', 'left');

        const state = { entities: [{ ...one, tags: ['changed'] }, two] };

        expect(index.getIdsBy(state, 'byGroup', 'left')).toEqual(previousIds);
        expect(index.getBy(state, 'byGroup', 'left')).not.toBe(previousEntities);
    });
});

describe('an entity that names the same group key more than once', () => {
    it('is in that group once', () => {
        // A transaction paying an address both from an input and to a target names it twice, and
        // belongs to the address once.
        const { index } = createGroupedIndex();
        const twice = { id: '1', group: 'left', tags: ['red', 'red'] };

        expect(index.getIdsBy({ entities: [twice] }, 'byTag', 'red')).toEqual(['1']);
        expect(index.getBy({ entities: [twice] }, 'byTag', 'red')).toEqual([twice]);
    });

    it('does not swallow a different entity that names the same key', () => {
        const { index } = createGroupedIndex();
        const first = { id: '1', group: 'left', tags: ['red', 'red'] };
        const second = { id: '2', group: 'left', tags: ['red'] };

        expect(index.getIdsBy({ entities: [first, second] }, 'byTag', 'red')).toEqual(['1', '2']);
    });
});
