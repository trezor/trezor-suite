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
