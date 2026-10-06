import { type Branded } from '@trezor/type-utils';

import { createIndex } from './createIndex';
import { type IndexIdOf } from './indexTypes';

type Total = { owner: string; amount: number };

type State = { totals: Total[] };

const selectTotals = (state: State) => state.totals;

const alice: Total = { owner: 'alice', amount: 3 };
const bob: Total = { owner: 'bob', amount: 10 };

const createTotalsIndex = () =>
    createIndex({ name: 'totals', source: selectTotals, getId: (total: Total) => total.owner });

describe('createIndex', () => {
    it('builds nothing until it is read', () => {
        const source = jest.fn(selectTotals);

        createIndex({ name: 'lazy', source, getId: (total: Total) => total.owner });

        expect(source).not.toHaveBeenCalled();
    });

    it('finds an entity by its id', () => {
        const index = createTotalsIndex();

        expect(index.getById({ totals: [alice, bob] }, index.asId('bob'))).toBe(bob);
    });

    it('answers with nothing for an id it does not hold', () => {
        const index = createTotalsIndex();

        expect(index.getById({ totals: [alice] }, index.asId('bob'))).toBeUndefined();
    });

    it('lists ids and entities in the order the source holds them', () => {
        const index = createTotalsIndex();

        expect(index.getIds({ totals: [bob, alice] })).toEqual(['bob', 'alice']);
        expect(index.getEntities({ totals: [bob, alice] })).toEqual([bob, alice]);
    });

    it('maps a list of ids onto the entities it holds, leaving out the unknown', () => {
        const index = createTotalsIndex();
        const ids = ['bob', 'nobody', 'alice'].map(index.asId);

        expect(index.getByIds({ totals: [alice, bob] }, ids)).toEqual([bob, alice]);
    });

    it('refuses two entities with one id', () => {
        const index = createTotalsIndex();

        expect(() => index.getIds({ totals: [alice, { ...alice }] })).toThrow(
            'index "totals" was given two entities with the id alice',
        );
    });
});

describe('createIndex naming its ids', () => {
    it('brands a plain id with the name of the index', () => {
        const index = createTotalsIndex();
        const id: IndexIdOf<typeof index> = index.asId('alice');

        expect(index.getId(alice)).toBe(id);
        // @ts-expect-error A plain string is not an id of this index.
        index.getById({ totals: [alice] }, 'alice');
    });

    it('keeps an id that already has a brand', () => {
        type OwnerId = string & Branded<'OwnerId'>;
        const index = createIndex({
            name: 'owners',
            source: selectTotals,
            getId: (total: Total) => total.owner as OwnerId,
        });
        const id: OwnerId = index.asId('alice');

        expect(index.getById({ totals: [alice] }, id)).toBe(alice);
    });
});

type OwnerParts = { owner: string };

describe('createIndex making its ids from parts', () => {
    const createOwnersIndex = () =>
        createIndex({
            name: 'owners',
            source: selectTotals,
            createId: ({ owner }: OwnerParts) => `owner:${owner}`,
        });

    it('files an entity under the id made from the entity when getId is left out', () => {
        const index = createOwnersIndex();

        expect(index.getById({ totals: [alice, bob] }, index.createId({ owner: 'bob' }))).toBe(bob);
        expect(index.getIds({ totals: [alice, bob] })).toEqual(['owner:alice', 'owner:bob']);
    });

    it('makes the id the one way, from the entity and from the parts alike', () => {
        const index = createOwnersIndex();
        const id: IndexIdOf<typeof index> = index.createId({ owner: 'alice' });

        expect(index.getId(alice)).toBe(id);
        expect(index.asId('owner:alice')).toBe(id);
        // @ts-expect-error A part may not be left out.
        index.createId({});
    });

    it('still takes getId beside createId when the entity is not the parts', () => {
        const index = createIndex({
            name: 'upper',
            source: selectTotals,
            createId: (parts: { name: string }) => parts.name.toUpperCase(),
            getId: (total: Total) => total.owner.toUpperCase(),
        });

        expect(index.getById({ totals: [alice] }, index.createId({ name: 'alice' }))).toBe(alice);
    });

    it('has no id to make from parts when it was given none', () => {
        const index = createTotalsIndex();

        expect(() => index.createId(undefined as never)).toThrow(
            'index "totals" was given no createId',
        );
    });
});

describe('createIndex matching entities against the ones it holds', () => {
    it('keeps the object it holds when the new one is shallowly the same', () => {
        const index = createTotalsIndex();
        const held = index.getById({ totals: [alice, bob] }, index.asId('alice'));

        expect(index.getById({ totals: [{ ...alice }, { ...bob }] }, index.asId('alice'))).toBe(
            held,
        );
    });

    it('takes the new object when a field changed', () => {
        const index = createTotalsIndex();
        index.getById({ totals: [alice] }, index.asId('alice'));
        const written = { ...alice, amount: 4 };

        expect(index.getById({ totals: [written] }, index.asId('alice'))).toBe(written);
    });

    it('matches the way it is told to', () => {
        const index = createIndex({
            name: 'byAmount',
            source: selectTotals,
            getId: (total: Total) => total.owner,
            isEqual: (previous, next) => previous.amount === next.amount,
        });
        const id = index.asId('alice');
        const held = index.getById({ totals: [alice] }, id);

        expect(index.getById({ totals: [{ owner: 'alice', amount: 3 }] }, id)).toBe(held);
        expect(index.getById({ totals: [{ owner: 'alice', amount: 5 }] }, id)).not.toBe(held);
    });

    it('hands back the same snapshot while the source is the one it was built from', () => {
        const index = createTotalsIndex();
        const state = { totals: [alice, bob] };

        expect(index.read(state)).toBe(index.read(state));
    });

    it('hands back the same snapshot for a new source holding shallowly the same entities', () => {
        const index = createTotalsIndex();
        const snapshot = index.read({ totals: [alice, bob] });

        expect(index.read({ totals: [{ ...alice }, { ...bob }] })).toBe(snapshot);
    });

    it('keeps the ids, and their set, when only an entity changed', () => {
        const index = createTotalsIndex();
        const ids = index.getIds({ totals: [alice, bob] });
        const idSet = index.getIdSet({ totals: [alice, bob] });

        const written = { totals: [{ ...alice, amount: 9 }, bob] };

        expect(index.getIds(written)).toBe(ids);
        expect(index.getIdSet(written)).toBe(idSet);
        expect(index.getEntities(written)).not.toBe(index.getEntities({ totals: [alice, bob] }));
    });

    it('gives new ids, and a new set, when an entity was added or removed', () => {
        const index = createTotalsIndex();
        const ids = index.getIds({ totals: [alice] });
        const idSet = index.getIdSet({ totals: [alice] });

        expect(index.getIds({ totals: [alice, bob] })).toEqual(['alice', 'bob']);
        expect(index.getIdSet({ totals: [alice, bob] })).not.toBe(idSet);
        expect(index.getIdSet({ totals: [alice, bob] }).has(index.asId('bob'))).toBe(true);
        expect(index.getIds({ totals: [bob] })).toEqual(['bob']);
        expect(index.getIds({ totals: [bob] })).not.toBe(ids);
    });

    it('hands back one shared empty snapshot, also after it has emptied out', () => {
        const index = createTotalsIndex();
        const emptyIds = index.getIds({ totals: [] });
        index.getIds({ totals: [alice] });

        expect(index.getIds({ totals: [] })).toBe(emptyIds);
        expect(index.getIdSet({ totals: [] })).toBe(index.getIdSet({ totals: [] }));
    });

    it('remembers the answer to a list of ids while nothing under them changed', () => {
        const index = createTotalsIndex();
        const ids = ['bob', 'alice'].map(index.asId);
        const state = { totals: [alice, bob] };

        expect(index.getByIds(state, ids)).toBe(index.getByIds(state, ids));
        expect(index.getByIds({ totals: [{ ...alice }, bob] }, ids)).toBe(
            index.getByIds(state, ids),
        );
    });
});

describe('createIndex telling what changed since the build before', () => {
    it('reports nothing on the first build and while nothing moved', () => {
        const index = createTotalsIndex();

        expect(index.read({ totals: [alice, bob] }).changes).toEqual({
            added: [],
            removed: [],
            updated: [],
        });
        expect(index.read({ totals: [{ ...alice }, bob] }).changes).toEqual({
            added: [],
            removed: [],
            updated: [],
        });
    });

    it('reports the ids that were added, removed and updated', () => {
        const index = createTotalsIndex();
        index.read({ totals: [alice, bob] });

        const { changes } = index.read({
            totals: [
                { ...alice, amount: 4 },
                { owner: 'carol', amount: 1 },
            ],
        });

        expect(changes).toEqual({ added: ['carol'], removed: ['bob'], updated: ['alice'] });
    });

    it('reports against the build before, not the one before that', () => {
        const index = createTotalsIndex();
        index.read({ totals: [alice] });
        index.read({ totals: [alice, bob] });

        expect(index.read({ totals: [alice, bob] }).changes.added).toEqual([]);
    });
});

describe('createIndex over another index', () => {
    it('reads the entities of the index it is composed from', () => {
        const totalsIndex = createTotalsIndex();
        const index = createIndex({
            name: 'totalsAgain',
            source: totalsIndex,
            getId: (total: Total) => total.owner.toUpperCase(),
        });

        expect(index.getById({ totals: [alice, bob] }, index.asId('BOB'))).toBe(bob);
    });

    it('does nothing while the index it is composed from stands', () => {
        const totalsIndex = createTotalsIndex();
        const getId = jest.fn((total: Total) => total.owner);
        const index = createIndex({ name: 'totalsAgain', source: totalsIndex, getId });
        const snapshot = index.read({ totals: [alice, bob] });
        getId.mockClear();

        expect(index.read({ totals: [{ ...alice }, bob] })).toBe(snapshot);
        expect(getId).not.toHaveBeenCalled();
    });
});
