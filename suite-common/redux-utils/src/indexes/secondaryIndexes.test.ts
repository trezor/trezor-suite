import { createEntityIndex } from './createEntityIndex';

type Tagged = { id: string; side: string; colour: string | undefined };

const createIndexWithSecondaryIndex = () => {
    const bySide = jest.fn((entity: Tagged) => entity.side);

    const index = createEntityIndex({
        name: 'tagged',
        selectSource: (state: { entities: Tagged[] }) => state.entities,
        getEntities: (entities: Tagged[]) => entities,
        getId: (entity: Tagged) => entity.id,
        secondaryIndexes: {
            bySide,
            byColour: (entity: Tagged) => entity.colour,
        },
    });

    return { index, bySide };
};

const one = { id: '1', side: 'left', colour: 'red' };
const two = { id: '2', side: 'left', colour: 'red' };
const three = { id: '3', side: 'right', colour: undefined };

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

    it('puts every entity that names a key under it', () => {
        const { index } = createIndexWithSecondaryIndex();
        const state = { entities: [one, two] };

        expect(index.getIdsBySecondaryKey(state, 'byColour', 'red')).toEqual(['1', '2']);
    });

    it('leaves out an entity that names no key', () => {
        const { index } = createIndexWithSecondaryIndex();

        expect(index.getIdsBySecondaryKey({ entities: [three] }, 'byColour', 'red')).toEqual([]);
    });

    it('hands back the same array for an entry whose members did not change', () => {
        // What keeps a component watching one account from re-rendering when another receives a
        // transaction.
        const { index } = createIndexWithSecondaryIndex();
        const left = index.getIdsBySecondaryKey({ entities: [one, two, three] }, 'bySide', 'left');

        const afterRightChanged = index.getIdsBySecondaryKey(
            { entities: [one, two, { ...three, colour: 'changed' }] },
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

describe('an entry whose entity changed', () => {
    it('hands back a new array, so a consumer watching it sees the change', () => {
        const { index } = createIndexWithSecondaryIndex();
        const left = index.getBySecondaryKey({ entities: [one, two, three] }, 'bySide', 'left');
        const changedTwo = { ...two, colour: 'changed' };

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
            { entities: [one, { ...two, colour: 'changed' }, three] },
            'bySide',
            'right',
        );

        expect(afterLeftChanged).toBe(right);
    });
});

describe('how often the source is walked for an index', () => {
    const walkCountingIndex = () => {
        const walks: string[] = [];
        const index = createEntityIndex({
            name: 'walks',
            selectSource: (state: { entities: Tagged[] }) => state.entities,
            getEntities: (entities: Tagged[]) => {
                walks.push('walk');

                return entities;
            },
            getId: (entity: Tagged) => entity.id,
            secondaryIndexes: { bySide: (entity: Tagged) => entity.side },
        });

        return { index, walks };
    };

    it('walks it once for a build whose index was read off the build before', () => {
        // What a consumer does every time: the same index, read after every write. The build fills
        // it as it walks, rather than walking the entities and then the id map it just made.
        const { index, walks } = walkCountingIndex();
        index.getIdsBySecondaryKey({ entities: [one] }, 'bySide', 'left');
        walks.length = 0;

        index.getIdsBySecondaryKey({ entities: [one, two] }, 'bySide', 'left');

        expect(walks).toHaveLength(1);
    });

    it('does not walk it again for an index read twice off one build', () => {
        const { index, walks } = walkCountingIndex();
        const state = { entities: [one, two] };

        index.getIdsBySecondaryKey(state, 'bySide', 'left');
        index.getIdsBySecondaryKey(state, 'bySide', 'right');

        expect(walks).toHaveLength(1);
    });
});

describe('an index nobody reads', () => {
    it('is not assembled, and its keys are never derived', () => {
        const bySide = jest.fn((entity: Tagged) => entity.side);
        const byColour = jest.fn((entity: Tagged) => entity.colour);
        const index = createEntityIndex({
            name: 'onlyWhatIsAsked',
            selectSource: (state: { entities: Tagged[] }) => state.entities,
            getEntities: (entities: Tagged[]) => entities,
            getId: (entity: Tagged) => entity.id,
            secondaryIndexes: { bySide, byColour },
        });

        index.getIdsBySecondaryKey({ entities: [one, two] }, 'bySide', 'left');

        expect(bySide).toHaveBeenCalledTimes(2);
        expect(byColour).not.toHaveBeenCalled();
    });

    it('is assembled once the read that wants it comes', () => {
        const { index, bySide } = createIndexWithSecondaryIndex();
        const state = { entities: [one, two] };

        index.getIds(state);
        expect(bySide).not.toHaveBeenCalled();

        index.getIdsBySecondaryKey(state, 'bySide', 'left');
        expect(bySide).toHaveBeenCalledTimes(2);
    });

    it('is asked for once per build, however often it is read', () => {
        const { index, bySide } = createIndexWithSecondaryIndex();
        const state = { entities: [one, two] };

        index.getIdsBySecondaryKey(state, 'bySide', 'left');
        index.getIdsBySecondaryKey(state, 'bySide', 'right');

        expect(bySide).toHaveBeenCalledTimes(2);
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
                { entities: [one, two, { ...three, colour: 'changed' }] },
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
        const state = { entities: [{ ...one, colour: 'changed' }, two] };

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
        const arrived = { id: '9', side: 'elsewhere', colour: undefined };

        expect(
            index.getIdsBySecondaryKey({ entities: [one, arrived] }, 'bySide', 'elsewhere'),
        ).toEqual(['9']);
    });

    it('follows an entity that changed which keys it names', () => {
        // Multi-key entries: the entity has to leave every key it no longer names.
        const { index } = createIndexWithSecondaryIndex();
        index.read({ entities: [one] });
        const recoloured = { ...one, colour: 'green' };

        const state = { entities: [recoloured] };

        expect(index.getIdsBySecondaryKey(state, 'byColour', 'red')).toEqual([]);
        expect(index.getIdsBySecondaryKey(state, 'byColour', 'blue')).toEqual([]);
        expect(index.getIdsBySecondaryKey(state, 'byColour', 'green')).toEqual(['1']);
    });

    it('empties every entry when the last entity goes', () => {
        const { index } = createIndexWithSecondaryIndex();
        index.read({ entities: [one, two, three] });

        const state = { entities: [] };

        expect(index.getIdsBySecondaryKey(state, 'bySide', 'left')).toEqual([]);
        expect(index.getIdsBySecondaryKey(state, 'byColour', 'red')).toEqual([]);
        expect(index.getIds(state)).toEqual([]);
    });

    it('keeps the ids array and replaces the entities array when a member was updated', () => {
        const { index } = createIndexWithSecondaryIndex();
        const before = { entities: [one, two] };
        const previousIds = index.getIdsBySecondaryKey(before, 'bySide', 'left');
        const previousEntities = index.getBySecondaryKey(before, 'bySide', 'left');

        const state = { entities: [{ ...one, colour: 'changed' }, two] };

        expect(index.getIdsBySecondaryKey(state, 'bySide', 'left')).toEqual(previousIds);
        expect(index.getBySecondaryKey(state, 'bySide', 'left')).not.toBe(previousEntities);
    });
});
