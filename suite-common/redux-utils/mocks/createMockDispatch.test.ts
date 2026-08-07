import { type ThunkAction, type UnknownAction } from '@reduxjs/toolkit';

import { createMockDispatch, failOnUnobservedSubscriptions } from './createMockDispatch';

type State = { value: number };
type Extra = { value: string };
type TestThunk = ThunkAction<Promise<void>, State, Extra, UnknownAction>;

const createTestMockDispatch = () =>
    createMockDispatch({ getState: () => ({ value: 1 }), extra: { value: 'extra' } });

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

    it('recursively runs thunks with the same dispatch, state and extra dependencies', async () => {
        const state = { value: 1 };
        const extra = { value: 'extra' };
        const { actions, dispatch, onDispatch } = createMockDispatch({
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

        const childDispatched = onDispatch((action, resolve) => {
            if (action.type === 'test/child') {
                resolve();
            }
        });

        dispatch(parentThunk);
        await childDispatched;

        expect(actions).toEqual([
            { type: 'test/parent' },
            { type: 'test/child', payload: { state, injectedExtra: extra } },
        ]);
    });

    describe('onDispatch', () => {
        it('notifies a listener about every dispatched action', () => {
            const { dispatch, onDispatch } = createTestMockDispatch();
            const listener = jest.fn();

            const subscription = onDispatch(listener);
            dispatch({ type: 'test/first' });
            dispatch({ type: 'test/second' });
            subscription.unsubscribe();

            expect(listener.mock.calls.map(([action]) => action)).toEqual([
                { type: 'test/first' },
                { type: 'test/second' },
            ]);
        });

        it('resolves the returned subscription when the listener resolves', async () => {
            const { dispatch, onDispatch } = createTestMockDispatch();
            const thunk: TestThunk = async thunkDispatch => {
                await Promise.resolve();
                thunkDispatch({ type: 'test/awaited', payload: { id: 'expected-id' } });
            };

            const dispatched = onDispatch((action, resolve) => {
                if (action.type !== 'test/awaited') return;

                expect(action.payload).toEqual({ id: 'expected-id' });
                resolve();
            });

            dispatch(thunk);

            await dispatched;
        });

        it('stops notifying the listener once it resolved', async () => {
            const { dispatch, onDispatch } = createTestMockDispatch();
            const listener = jest.fn((_action, resolve: () => void) => resolve());

            const dispatched = onDispatch(listener);
            dispatch({ type: 'test/first' });
            await dispatched;
            dispatch({ type: 'test/second' });

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('rejects an awaited subscription that the listener never resolves', async () => {
            const { dispatch, onDispatch } = createTestMockDispatch();

            const dispatched = onDispatch(() => {}, { timeout: 10 });
            dispatch({ type: 'test/unrelated' });

            await expect(dispatched).rejects.toThrow(
                'onDispatch timed out after 10 ms, dispatched actions: test/unrelated',
            );
        });

        it('rejects an awaited subscription with an error handed to its resolve', async () => {
            const { dispatch, onDispatch } = createTestMockDispatch();
            const thunk: TestThunk = async thunkDispatch => {
                await Promise.resolve();
                thunkDispatch({ type: 'test/awaited' });
            };

            const dispatched = onDispatch((action, resolve) => {
                if (action.type !== 'test/awaited') return;

                resolve(new Error('the action arrived in a state the test rejects'));
            });
            dispatch(thunk);

            await expect(dispatched).rejects.toThrow(
                'the action arrived in a state the test rejects',
            );
        });

        // Assertions belong in the listener, so a failing one has to surface as the failure of the
        // awaited subscription. Left to propagate, it would instead break the code that dispatched
        // the action and the test would fail on a timeout, hiding the assertion.
        it('rejects an awaited subscription with what the listener threw', async () => {
            const { dispatch, onDispatch } = createTestMockDispatch();
            const thunk: TestThunk = async thunkDispatch => {
                await Promise.resolve();
                thunkDispatch({ type: 'test/awaited' });
            };

            const dispatched = onDispatch(action => {
                if (action.type !== 'test/awaited') return;

                expect(action.payload).toBe('never dispatched with a payload');
            });
            dispatch(thunk);

            await expect(dispatched).rejects.toThrow('never dispatched with a payload');
        });

        it('does not break the dispatching code when the listener throws', async () => {
            const { dispatch, onDispatch } = createTestMockDispatch();
            let thunkFinished = false;
            const thunk: TestThunk = async thunkDispatch => {
                await Promise.resolve();
                thunkDispatch({ type: 'test/awaited' });
                thunkFinished = true;
            };

            const dispatched = onDispatch(() => {
                throw new Error('listener failed');
            });
            dispatch(thunk);
            await expect(dispatched).rejects.toThrow('listener failed');

            expect(thunkFinished).toBe(true);
        });

        // A subscription used as a plain listener must not schedule a rejection nobody awaits,
        // which would surface as an unhandled promise rejection.
        it('does not start the timeout of a subscription before it is awaited', () => {
            const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
            const { onDispatch } = createTestMockDispatch();

            onDispatch(() => {}).unsubscribe();

            expect(setTimeoutSpy).not.toHaveBeenCalled();

            setTimeoutSpy.mockRestore();
        });
    });

    describe('failOnUnobservedSubscriptions', () => {
        it('reports a subscription that was neither awaited nor unsubscribed', () => {
            const { onDispatch } = createTestMockDispatch();

            onDispatch(() => {});

            expect(() => failOnUnobservedSubscriptions()).toThrow(
                'onDispatch subscription was never awaited or unsubscribed',
            );
        });

        it('points at the line the forgotten subscription was created on', () => {
            const { onDispatch } = createTestMockDispatch();

            onDispatch(() => {});

            expect(() => failOnUnobservedSubscriptions()).toThrow('createMockDispatch.test.ts');
        });

        it('accepts an awaited subscription', async () => {
            const { dispatch, onDispatch } = createTestMockDispatch();
            const thunk: TestThunk = async thunkDispatch => {
                await Promise.resolve();
                thunkDispatch({ type: 'test/awaited' });
            };

            const dispatched = onDispatch((_action, resolve) => resolve());
            dispatch(thunk);
            await dispatched;

            expect(() => failOnUnobservedSubscriptions()).not.toThrow();
        });

        it('accepts an unsubscribed subscription', () => {
            const { onDispatch } = createTestMockDispatch();

            onDispatch(() => {}).unsubscribe();

            expect(() => failOnUnobservedSubscriptions()).not.toThrow();
        });

        it('reports each forgotten subscription only once', () => {
            const { onDispatch } = createTestMockDispatch();

            onDispatch(() => {});

            expect(() => failOnUnobservedSubscriptions()).toThrow();
            expect(() => failOnUnobservedSubscriptions()).not.toThrow();
        });

        it('stops notifying an unsubscribed listener', () => {
            const { dispatch, onDispatch } = createTestMockDispatch();
            const listener = jest.fn();

            const subscription = onDispatch(listener);
            dispatch({ type: 'test/before' });
            subscription.unsubscribe();
            dispatch({ type: 'test/after' });

            expect(listener.mock.calls.map(([action]) => action)).toEqual([
                { type: 'test/before' },
            ]);
        });
    });
});
