/**
 * @jest-environment jsdom
 */
import { type ReactNode } from 'react';
import { Provider, useSelector } from 'react-redux';

import { configureStore, createSlice } from '@reduxjs/toolkit';
import { act, render, renderHook, screen } from '@testing-library/react';

import { createEntityIndex } from './createEntityIndex';
import {
    useEntityById,
    useEntityIds,
    useEntityIdsBy,
    useEntityIndexRetention,
} from './useEntityIndex';

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

describe('useEntityIndexRetention', () => {
    it('holds the build for a screen that reads the index some other way', () => {
        const { index, getEntities } = createIndex();
        const store = createTestStore([a]);

        const { unmount } = renderHook(() => useEntityIndexRetention(index), {
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

const createGroupedIndex = () =>
    createEntityIndex({
        name: 'groupedThings',
        selectSource: (state: State) => state.things,
        getEntities: (things: Thing[]) => things,
        getId: (thing: Thing) => thing.id,
        // `value` stands in for whatever a real index groups by — the account a transaction
        // belongs to, say.
        groupBy: { byValue: (thing: Thing) => thing.value },
    });

describe('useEntityIdsBy', () => {
    const left = { id: 'a', value: 'left' };
    const right = { id: 'b', value: 'right' };

    it('reads the ids in one group', () => {
        const index = createGroupedIndex();
        const store = createTestStore([left, right]);

        const { result } = renderHook(() => useEntityIdsBy(index, 'byValue', 'left'), {
            wrapper: createWrapper(store),
        });

        expect(result.current).toEqual(['a']);
    });

    it('reads nothing for a key the group does not hold', () => {
        const index = createGroupedIndex();
        const store = createTestStore([left]);

        const { result } = renderHook(() => useEntityIdsBy(index, 'byValue', 'nowhere'), {
            wrapper: createWrapper(store),
        });

        expect(result.current).toEqual([]);
    });

    it('does not re-render when another group changes', () => {
        // The point of grouping: a screen showing one account's history is not woken because
        // another account received a transaction.
        const index = createGroupedIndex();
        const store = createTestStore([left, right]);
        const renders = jest.fn();

        renderHook(
            () => {
                renders();

                return useEntityIdsBy(index, 'byValue', 'left');
            },
            { wrapper: createWrapper(store) },
        );
        renders.mockClear();

        act(() => {
            store.dispatch(setThings([left, right, { id: 'c', value: 'right' }]));
        });

        expect(renders).not.toHaveBeenCalled();
    });

    it('re-renders when its own group changes', () => {
        const index = createGroupedIndex();
        const store = createTestStore([left, right]);

        const { result } = renderHook(() => useEntityIdsBy(index, 'byValue', 'left'), {
            wrapper: createWrapper(store),
        });

        act(() => {
            store.dispatch(setThings([left, right, { id: 'c', value: 'left' }]));
        });

        expect(result.current).toEqual(['a', 'c']);
    });
});

describe('reading an index through a plain useSelector', () => {
    // Nothing about the index needs the hooks: `getById` is `(state) => value`, and the memo is
    // the index itself rather than anything held per call site. So it drops into existing
    // selectors and existing components unchanged.
    it('reads an entity', () => {
        const { index } = createIndex();
        const store = createTestStore([a, b]);

        const { result } = renderHook(
            () => useSelector((state: State) => index.getById(state, 'b')),
            { wrapper: createWrapper(store) },
        );

        expect(result.current).toBe(b);
    });

    it('builds once for a whole list, the same as through the hooks', () => {
        const { index, getEntities } = createIndex();
        const store = createTestStore([a, b]);

        const Row = ({ id }: { id: string }) => (
            <span>{useSelector((state: State) => index.getById(state, id))?.value}</span>
        );

        render(
            <Provider store={store}>
                <Row id="a" />
                <Row id="b" />
            </Provider>,
        );

        expect(getEntities).toHaveBeenCalledTimes(1);
    });

    it('re-renders only when the entity it read changes', () => {
        const { index } = createIndex();
        const store = createTestStore([a, b]);
        const renders = jest.fn();

        renderHook(
            () => {
                renders();

                return useSelector((state: State) => index.getById(state, 'b'));
            },
            { wrapper: createWrapper(store) },
        );
        renders.mockClear();

        act(() => {
            store.dispatch(setThings([{ ...a, value: 'changed' }, b]));
        });

        expect(renders).not.toHaveBeenCalled();
    });

    it('keeps its build with no subscriber anywhere', () => {
        // Nobody ever subscribes, so nothing ever releases: the memo lasts as long as the source.
        const { index, getEntities } = createIndex();
        const store = createTestStore([a, b]);
        const wrapper = createWrapper(store);

        renderHook(() => useSelector((state: State) => index.getById(state, 'a')), {
            wrapper,
        }).unmount();
        getEntities.mockClear();
        renderHook(() => useSelector((state: State) => index.getById(state, 'a')), { wrapper });

        expect(getEntities).not.toHaveBeenCalled();
    });

    it('loses its build when a component that did subscribe unmounts', () => {
        // The one thing to know about mixing the two: the ref count only sees the hooks, so the
        // last of them leaving releases the build even though a plain reader is still around. It
        // costs that reader one rebuild, never a wrong answer.
        const { index, getEntities } = createIndex();
        const store = createTestStore([a, b]);
        const wrapper = createWrapper(store);

        const subscribed = renderHook(() => useEntityById(index, 'a'), { wrapper });
        renderHook(() => useSelector((state: State) => index.getById(state, 'a')), { wrapper });
        getEntities.mockClear();

        subscribed.unmount();
        renderHook(() => useSelector((state: State) => index.getById(state, 'a')), { wrapper });

        expect(getEntities).toHaveBeenCalledTimes(1);
    });
});
