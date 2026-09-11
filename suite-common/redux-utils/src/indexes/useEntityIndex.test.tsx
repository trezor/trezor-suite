/**
 * @jest-environment jsdom
 */
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { configureStore, createSlice } from '@reduxjs/toolkit';
import { act, render, renderHook, screen } from '@testing-library/react';

import { createEntityIndex } from './createEntityIndex';
import { useEntityById, useEntityIds, useEntityIndexSubscription } from './useEntityIndex';

type Thing = { id: string; value: string };

const thingsSlice = createSlice({
    name: 'things',
    initialState: { things: [] as Thing[], unrelated: 0 },
    reducers: {
        setThings: (state, { payload }: { payload: Thing[] }) => {
            state.things = payload;
        },
        // Stands in for every other reducer in the app: writes that must not cost the index a
        // rebuild, nor its consumers a re-render.
        touchSomethingElse: state => {
            state.unrelated += 1;
        },
    },
});

const { setThings, touchSomethingElse } = thingsSlice.actions;

type State = ReturnType<typeof thingsSlice.reducer>;

const createTestStore = (things: Thing[]) =>
    configureStore({
        reducer: thingsSlice.reducer,
        preloadedState: { things, unrelated: 0 },
    });

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

const a = { id: 'a', value: 'first' };
const b = { id: 'b', value: 'second' };

const createWrapper = (store: ReturnType<typeof createTestStore>) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return <Provider store={store}>{children}</Provider>;
    };

describe('useEntityById', () => {
    it('reads the entity with that id', () => {
        const { index } = createIndex();
        const store = createTestStore([a, b]);

        const { result } = renderHook(() => useEntityById(index, 'b'), {
            wrapper: createWrapper(store),
        });

        expect(result.current).toBe(b);
    });

    it('reads nothing for an id the store does not hold', () => {
        const { index } = createIndex();
        const store = createTestStore([a]);

        const { result } = renderHook(() => useEntityById(index, 'b'), {
            wrapper: createWrapper(store),
        });

        expect(result.current).toBeUndefined();
    });

    it('re-renders when its own entity changes', () => {
        const { index } = createIndex();
        const store = createTestStore([a, b]);
        const updated = { ...b, value: 'changed' };

        const { result } = renderHook(() => useEntityById(index, 'b'), {
            wrapper: createWrapper(store),
        });

        act(() => {
            store.dispatch(setThings([a, updated]));
        });

        expect(result.current).toBe(updated);
    });

    it('does not re-render when another entity changes', () => {
        // What makes an index worth having in a list: a row watches its own entity, and its
        // neighbours changing does not wake it.
        const { index } = createIndex();
        const store = createTestStore([a, b]);
        const renders = jest.fn();

        renderHook(
            () => {
                renders();

                return useEntityById(index, 'b');
            },
            { wrapper: createWrapper(store) },
        );
        renders.mockClear();

        act(() => {
            store.dispatch(setThings([{ ...a, value: 'changed' }, b]));
        });

        expect(renders).not.toHaveBeenCalled();
    });

    it('does not re-render when an unrelated reducer writes', () => {
        const { index } = createIndex();
        const store = createTestStore([a, b]);
        const renders = jest.fn();

        renderHook(
            () => {
                renders();

                return useEntityById(index, 'b');
            },
            { wrapper: createWrapper(store) },
        );
        renders.mockClear();

        act(() => {
            store.dispatch(touchSomethingElse());
        });

        expect(renders).not.toHaveBeenCalled();
    });

    it('follows the id it is given when that changes', () => {
        const { index } = createIndex();
        const store = createTestStore([a, b]);

        const { result, rerender } = renderHook(
            ({ id }: { id: string }) => useEntityById(index, id),
            {
                wrapper: createWrapper(store),
                initialProps: { id: 'a' },
            },
        );
        rerender({ id: 'b' });

        expect(result.current).toBe(b);
    });
});

describe('useEntityIds', () => {
    it('reads every id', () => {
        const { index } = createIndex();
        const store = createTestStore([a, b]);

        const { result } = renderHook(() => useEntityIds(index), {
            wrapper: createWrapper(store),
        });

        expect(result.current).toEqual(['a', 'b']);
    });

    it('hands back the same array while the entities are unchanged', () => {
        // So a list can pass it to `map` without re-keying, and to memoized children without
        // invalidating them.
        const { index } = createIndex();
        const store = createTestStore([a, b]);

        const { result } = renderHook(() => useEntityIds(index), {
            wrapper: createWrapper(store),
        });
        const first = result.current;

        act(() => {
            store.dispatch(touchSomethingElse());
        });

        expect(result.current).toBe(first);
    });
});

describe('the index a component is reading', () => {
    it('is built once for a whole list rendering on the same store state', () => {
        // The reason the index is one shared object: a hundred rows asking a hundred questions
        // are one build.
        const { index, getEntities } = createIndex();
        const store = createTestStore([a, b]);

        const Row = ({ id }: { id: string }) => <span>{useEntityById(index, id)?.value}</span>;

        render(
            <Provider store={store}>
                <Row id="a" />
                <Row id="b" />
                <Row id="a" />
            </Provider>,
        );

        expect(getEntities).toHaveBeenCalledTimes(1);
        expect(screen.getAllByText('first')).toHaveLength(2);
    });

    it('is held for as long as a component is reading it', () => {
        const { index } = createIndex();
        const store = createTestStore([a]);

        const { unmount } = renderHook(() => useEntityById(index, 'a'), {
            wrapper: createWrapper(store),
        });

        expect(index.getSubscriberCount()).toBe(1);

        unmount();

        expect(index.getSubscriberCount()).toBe(0);
    });

    it('is released once the last component reading it goes away', () => {
        const { index, getEntities } = createIndex();
        const store = createTestStore([a]);
        const wrapper = createWrapper(store);

        const first = renderHook(() => useEntityById(index, 'a'), { wrapper });
        const second = renderHook(() => useEntityById(index, 'a'), { wrapper });
        getEntities.mockClear();

        first.unmount();
        // Still held: the second component is reading it.
        renderHook(() => useEntityById(index, 'a'), { wrapper }).unmount();

        expect(getEntities).not.toHaveBeenCalled();

        second.unmount();
        renderHook(() => useEntityById(index, 'a'), { wrapper });

        expect(getEntities).toHaveBeenCalledTimes(1);
    });
});

describe('useEntityIndexSubscription', () => {
    it('holds the build for a screen that reads the index some other way', () => {
        const { index, getEntities } = createIndex();
        const store = createTestStore([a]);

        const { unmount } = renderHook(() => useEntityIndexSubscription(index), {
            wrapper: createWrapper(store),
        });

        // Nothing is built by subscribing alone — the index stays lazy until something reads it.
        expect(getEntities).not.toHaveBeenCalled();

        index.read(store.getState());
        index.read(store.getState());

        expect(getEntities).toHaveBeenCalledTimes(1);

        unmount();

        expect(index.getSubscriberCount()).toBe(0);
    });
});
