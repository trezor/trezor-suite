import { type ThunkAction, type UnknownAction } from '@reduxjs/toolkit';

import { createMockDispatch } from './createMockDispatch';

type State = { value: number };
type Extra = { value: string };
type TestThunk = ThunkAction<Promise<void>, State, Extra, UnknownAction>;

describe(createMockDispatch.name, () => {
    it('stores plain actions', () => {
        const { actions, dispatch } = createMockDispatch({
            getState: () => ({ value: 1 }),
            extra: { value: 'extra' },
        });
        const action = { type: 'test/action', payload: 42 };

        const result = dispatch(action);

        expect(result).toBe(action);
        expect(actions).toEqual([action]);
    });

    it('recursively runs thunks and waits for their actions', async () => {
        const state = { value: 1 };
        const extra = { value: 'extra' };
        const { actions, dispatch, waitForThunks } = createMockDispatch({
            getState: () => state,
            extra,
        });
        const childThunk: TestThunk = async (childDispatch, getState, injectedExtra) => {
            await Promise.resolve();
            childDispatch({ type: 'test/child', payload: { state: getState(), injectedExtra } });
        };
        const parentThunk: TestThunk = async parentDispatch => {
            await Promise.resolve();
            parentDispatch(childThunk);
            parentDispatch({ type: 'test/parent' });
        };

        dispatch(parentThunk);
        await waitForThunks();

        expect(actions).toEqual([
            { type: 'test/parent' },
            { type: 'test/child', payload: { state, injectedExtra: extra } },
        ]);
    });
});
