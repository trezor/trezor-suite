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
