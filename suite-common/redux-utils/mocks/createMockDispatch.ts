import { type Action, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

type CreateMockDispatchParams<TState, TExtra> = {
    getState: () => TState;
    extra: TExtra;
};

type MockDispatch<TState, TExtra, TAction extends Action> = {
    actions: unknown[];
    dispatch: ThunkDispatch<TState, TExtra, TAction>;
    waitForThunks: () => Promise<void>;
};

export const createMockDispatch = <TState, TExtra, TAction extends Action = UnknownAction>({
    getState,
    extra,
}: CreateMockDispatchParams<TState, TExtra>): MockDispatch<TState, TExtra, TAction> => {
    const actions: unknown[] = [];
    const thunkPromises: Promise<unknown>[] = [];

    // Calling a thunk directly in a test bypasses the Redux store and its thunk middleware. This
    // small replacement does the two middleware jobs these tests need: it stores plain actions for
    // assertions, and it runs function actions recursively with the same dispatch, state and extra
    // dependencies.
    const dispatch: ThunkDispatch<TState, TExtra, TAction> = (action: unknown) => {
        if (typeof action === 'function') {
            // We cannot simply await here. Making dispatch async would only make dispatch return a
            // promise; it would not force its caller to await that promise. Production callbacks
            // such as event listeners often intentionally ignore the value returned by dispatch.
            // Keep the promise so the test can explicitly wait until the thunk is really finished.
            const thunkPromise = Promise.resolve(action(dispatch, getState, extra));
            thunkPromises.push(thunkPromise);

            return thunkPromise;
        }

        actions.push(action);

        return action;
    };

    // A running thunk may dispatch another asynchronous thunk. Keep draining the list until every
    // recursively dispatched thunk has completed, including thunks added while we were waiting.
    const waitForThunks = async () => {
        while (thunkPromises.length > 0) {
            await Promise.all(thunkPromises.splice(0));
        }
    };

    return { actions, dispatch, waitForThunks };
};
