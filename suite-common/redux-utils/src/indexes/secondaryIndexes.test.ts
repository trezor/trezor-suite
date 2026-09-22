import { createEntityIndex } from './createEntityIndex';

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

    it('asks an entity for its key once per index, however often the index is read', () => {
        const { index, bySide } = createIndexWithSecondaryIndex();
        const state = { entities: [one, two] };

        index.getIdsBySecondaryKey(state, 'bySide', 'left');
        index.getIdsBySecondaryKey(state, 'bySide', 'left');

        expect(bySide).toHaveBeenCalledTimes(2);
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

        const snapshot = listener.mock.calls.at(-1)?.[0];

        expect(snapshot.getChanges()).toEqual({ added: [], removed: [], updated: ['2'] });
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
