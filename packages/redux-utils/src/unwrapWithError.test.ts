import { configureStore } from '@reduxjs/toolkit';

import { createThunk } from './createThunk';
import { unwrapWithError } from './unwrapWithError';

class RippledError extends Error {
    name = 'RippledError';
}

const resolvingThunk = createThunk<number, void, void>('test/resolving', () => 42);

const throwingThunk = createThunk<never, void, void>('test/throwing', () => {
    throw new RippledError('invalidParams');
});

const rejectingWithValueThunk = createThunk<never, void, { state: unknown; rejectValue: string }>(
    'test/rejectingWithValue',
    (_, { rejectWithValue }) => rejectWithValue('rejected value'),
);

const createStore = () =>
    configureStore({
        reducer: (state = {}) => state,
        middleware: getDefaultMiddleware => getDefaultMiddleware({ thunk: { extraArgument: {} } }),
    });

describe('unwrapWithError', () => {
    it('should resolve with the thunk payload', async () => {
        const store = createStore();

        await expect(unwrapWithError(store.dispatch(resolvingThunk()))).resolves.toBe(42);
    });

    it('should reject with an Error preserving the name, message and stack of the thrown error', async () => {
        const store = createStore();

        const error = await unwrapWithError(store.dispatch(throwingThunk())).catch(e => e);

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('RippledError');
        expect(error.message).toBe('invalidParams');
        expect(error.stack).toContain('invalidParams');
    });

    it('should reject with an Error when the thunk rejects with a value', async () => {
        const store = createStore();

        const error = await unwrapWithError(store.dispatch(rejectingWithValueThunk())).catch(
            e => e,
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('rejected value');
    });
});
