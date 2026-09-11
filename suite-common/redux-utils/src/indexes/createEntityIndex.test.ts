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
        index.retain();

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

    it('lists ids in the order the source yields them', () => {
        const { index } = createIndex();

        expect(index.getIds(createState([b, a]))).toEqual(['b', 'a']);
    });

    describe('while subscribed', () => {
        it('builds once for repeated reads of an unchanged source', () => {
            // The point of the index: a re-render that changed nothing else costs one comparison.
            const { index, getEntities } = createIndex();
            index.retain();
            const state = createState([a, b]);

            index.read(state);
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(1);
        });

        it('hands back the same snapshot, so consumers can compare by reference', () => {
            const { index } = createIndex();
            index.retain();
            const state = createState([a, b]);

            expect(index.read(state)).toBe(index.read(state));
        });

        it('builds once for two consumers of the same index', () => {
            // Two screens asking the same question in one render pass are one build, not two.
            const { index, getEntities } = createIndex();
            index.retain();
            index.retain();
            const state = createState([a, b]);

            index.read(state);
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(1);
        });

        it('rebuilds when the source is replaced', () => {
            const { index } = createIndex();
            index.retain();
            const updated = { ...b, value: 'changed' };

            expect(index.getById(createState([a, b]), 'b')).toBe(b);
            expect(index.getById(createState([a, updated]), 'b')).toBe(updated);
        });

        it('does not rebuild for a state object that kept the same source', () => {
            // Reducers other than this one write on every action; those writes must not cost a
            // rebuild here.
            const { index, getEntities } = createIndex();
            index.retain();
            const things = [a, b];

            index.read({ things });
            index.read({ things });

            expect(getEntities).toHaveBeenCalledTimes(1);
        });
    });

    describe('while nobody is subscribed', () => {
        it('still answers correctly', () => {
            const { index } = createIndex();

            expect(index.getById(createState([a]), 'a')).toBe(a);
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
            const release = index.retain();
            const state = createState([a, b]);

            index.read(state);
            release();
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(2);
        });

        it('keeps holding while any subscriber remains', () => {
            const { index, getEntities } = createIndex();
            const release = index.retain();
            index.retain();
            const state = createState([a, b]);

            index.read(state);
            release();
            index.read(state);

            expect(getEntities).toHaveBeenCalledTimes(1);
        });

        it('ignores a consumer unsubscribing twice', () => {
            // Otherwise one sloppy consumer releases a build another one is still holding.
            const { index, getEntities } = createIndex();
            const release = index.retain();
            index.retain();
            release();
            release();
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
        index.retain();

        index.read({ byGroup: { left: [a], right: untouched } });
        getEntities.mockClear();
        index.read({ byGroup: { left: [a, b], right: untouched } });

        expect(getEntities).toHaveBeenCalledTimes(1);
        expect(getEntities).toHaveBeenCalledWith([a, b]);
    });

    it('still holds the entities of the parts it did not walk', () => {
        const { index } = createPartitionedIndex();
        const untouched = [c];
        index.retain();

        index.read({ byGroup: { left: [a], right: untouched } });
        const state = { byGroup: { left: [a, b], right: untouched } };

        expect(index.getById(state, 'c')).toBe(c);
        expect(index.getById(state, 'b')).toBe(b);
    });

    it('walks a part it has not seen before', () => {
        const { index, getEntities } = createPartitionedIndex();
        const untouched = [a];
        index.retain();

        index.read({ byGroup: { left: untouched } });
        getEntities.mockClear();
        index.read({ byGroup: { left: untouched, right: [c] } });

        expect(getEntities).toHaveBeenCalledTimes(1);
        expect(getEntities).toHaveBeenCalledWith([c]);
    });

    it('drops the entities of a part the source no longer has', () => {
        const { index } = createPartitionedIndex();
        const untouched = [a];
        index.retain();

        index.read({ byGroup: { left: untouched, right: [c] } });

        expect(index.getById({ byGroup: { left: untouched } }, 'c')).toBeUndefined();
    });
});

describe('what a rebuild changed', () => {
    const readChanges = (index: ReturnType<typeof createIndex>['index'], state: State) =>
        index.read(state).changes;

    it('is nothing on the first build, which nobody can have missed', () => {
        const { index } = createIndex();
        index.retain();

        expect(readChanges(index, createState([a, b]))).toEqual({
            added: [],
            removed: [],
            updated: [],
        });
    });

    it('reports an entity that arrived', () => {
        const { index } = createIndex();
        index.retain();
        index.read(createState([a]));

        expect(readChanges(index, createState([a, b]))).toEqual({
            added: ['b'],
            removed: [],
            updated: [],
        });
    });

    it('reports an entity that went away', () => {
        const { index } = createIndex();
        index.retain();
        index.read(createState([a, b]));

        expect(readChanges(index, createState([a]))).toEqual({
            added: [],
            removed: ['b'],
            updated: [],
        });
    });

    it('reports an entity that is a different object than it was', () => {
        const { index } = createIndex();
        index.retain();
        index.read(createState([a, b]));

        expect(readChanges(index, createState([a, { ...b, value: 'changed' }]))).toEqual({
            added: [],
            removed: [],
            updated: ['b'],
        });
    });

    it('says nothing about an entity that is the same object as before', () => {
        const { index } = createIndex();
        index.retain();
        index.read(createState([a, b]));

        // `a` is carried across untouched, so it is in none of the three lists.
        expect(readChanges(index, createState([a, { ...b, value: 'changed' }])).updated).toEqual([
            'b',
        ]);
    });

    it('does not report an entity that only moved between parts as gone', () => {
        const { index } = createPartitionedIndex();
        index.retain();
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
        index.retain();
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
        index.retain();
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
        partitioned.retain();

        partitioned.read({ byGroup: { a: untouched, b: [two] } });
        byGroup.mockClear();
        partitioned.read({ byGroup: { a: untouched, b: [two, three] } });

        // Only the rebuilt part's entities were asked which group they belong to.
        expect(byGroup).toHaveBeenCalledTimes(2);
        expect(byGroup).not.toHaveBeenCalledWith(one);
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
        index.retain();
        const left = index.getBy({ entities: [one, two, three] }, 'byGroup', 'left');

        expect(
            index.getBy({ entities: [one, two, { ...three, tags: ['new'] }] }, 'byGroup', 'left'),
        ).toBe(left);
    });

    it('hands back a new array when a member of the group was replaced', () => {
        // The ids did not change, but the entities did — which a consumer reading entities has to
        // see, and a consumer reading ids has no reason to be woken by.
        const { index } = createGroupedIndex();
        index.retain();
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

    it('keeps the build for as long as a listener wants it', () => {
        const { index, getEntities } = createIndex();
        const unsubscribe = index.subscribe(jest.fn());
        const state = createState([a, b]);

        index.read(state);
        unsubscribe();
        index.read(state);

        expect(getEntities).toHaveBeenCalledTimes(2);
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
        index.retain();
        index.read({ entities: [one, two] });
        const moved = { ...one, group: 'right' };

        const state = { entities: [moved, two] };

        expect(index.getIdsBy(state, 'byGroup', 'left')).toEqual(['2']);
        expect(index.getIdsBy(state, 'byGroup', 'right')).toEqual(['1']);
        expect(index.getBy(state, 'byGroup', 'right')).toEqual([moved]);
    });

    it('empties a group whose last member left it', () => {
        const { index } = createGroupedIndex();
        index.retain();
        index.read({ entities: [one] });

        expect(
            index.getIdsBy({ entities: [{ ...one, group: 'right' }] }, 'byGroup', 'left'),
        ).toEqual([]);
    });

    it('empties a group whose last member was removed', () => {
        const { index } = createGroupedIndex();
        index.retain();
        index.read({ entities: [one, three] });

        expect(index.getIdsBy({ entities: [three] }, 'byGroup', 'left')).toEqual([]);
    });

    it('opens a group for a key nothing had before', () => {
        const { index } = createGroupedIndex();
        index.retain();
        index.read({ entities: [one] });
        const arrived = { id: '9', group: 'elsewhere', tags: [] };

        expect(index.getIdsBy({ entities: [one, arrived] }, 'byGroup', 'elsewhere')).toEqual(['9']);
    });

    it('follows an entity that changed which keys it names', () => {
        // Multi-key groups: the entity has to leave every key it no longer names.
        const { index } = createGroupedIndex();
        index.retain();
        index.read({ entities: [one] });
        const retagged = { ...one, tags: ['green'] };

        const state = { entities: [retagged] };

        expect(index.getIdsBy(state, 'byTag', 'red')).toEqual([]);
        expect(index.getIdsBy(state, 'byTag', 'blue')).toEqual([]);
        expect(index.getIdsBy(state, 'byTag', 'green')).toEqual(['1']);
    });

    it('empties every group when the last entity goes', () => {
        const { index } = createGroupedIndex();
        index.retain();
        index.read({ entities: [one, two, three] });

        const state = { entities: [] };

        expect(index.getIdsBy(state, 'byGroup', 'left')).toEqual([]);
        expect(index.getIdsBy(state, 'byTag', 'red')).toEqual([]);
        expect(index.getIds(state)).toEqual([]);
    });

    it('keeps the ids array and replaces the entities array when a member was updated', () => {
        const { index } = createGroupedIndex();
        index.retain();
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
