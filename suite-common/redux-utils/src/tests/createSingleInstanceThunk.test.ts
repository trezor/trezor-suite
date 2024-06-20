import { configureStore } from '@reduxjs/toolkit';

import { createSingleInstanceThunk } from '../createSingleInstanceThunk';

describe('createSingleInstanceThunk', () => {
    // Test thunk for asynchronous action
    const fakeAsyncThunkPayloadCreator = jest.fn((param: number) => {
        return new Promise<number>(resolve => {
            setTimeout(() => resolve(param), 100); // Resolve after 100 ms
        });
    });

    const singleInstanceThunk = createSingleInstanceThunk<number, number>(
        'test/thunk',
        fakeAsyncThunkPayloadCreator,
    );

    const store = configureStore({
        reducer: (state = {}, action) => {
            switch (action.type) {
                case 'test/thunk/fulfilled':
                    return { ...state, data: action.payload };
                default:
                    return state;
            }
        },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: {} as any,
                },
                serializableCheck: false,
                immutableCheck: false,
            }),
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers(); // Ensure all timers are flushed
        jest.useRealTimers(); // Restore real timers after each test
    });

    test('should ensure only one instance is running at a time with the same parameters', async () => {
        const promise1 = store.dispatch(singleInstanceThunk(42));
        const promise2 = store.dispatch(singleInstanceThunk(42)); // Simultaneously dispatching same params
        const promise3 = store.dispatch(singleInstanceThunk(42)); // Simultaneously dispatching same params

        jest.advanceTimersByTime(100);

        // All promises should resolve to the same value
        const result1 = await promise1;
        const result2 = await promise2;
        const result3 = await promise3;

        expect(result1.payload).toBe(42);
        expect(result2.payload).toBe(42);
        expect(result3.payload).toBe(42);

        // The thunk should have been called only once since all dispatches should share the same instance
        expect(fakeAsyncThunkPayloadCreator).toHaveBeenCalledTimes(1);
    });

    test('should allow a new instance after the previous one resolves', async () => {
        const result1 = store.dispatch(singleInstanceThunk(42));
        jest.advanceTimersByTime(100);

        expect((await result1).payload).toBe(42);

        const result2 = store.dispatch(singleInstanceThunk(42));
        jest.advanceTimersByTime(100);
        expect((await result2).payload).toBe(42);

        // The thunk should have been called twice, once for each resolved instance
        expect(fakeAsyncThunkPayloadCreator).toHaveBeenCalledTimes(2);
    });

    test('should handle identical and different instances correctly', async () => {
        const promise1 = store.dispatch(singleInstanceThunk(42));
        const promise2 = store.dispatch(singleInstanceThunk(42)); // Same as promise1
        const promise3 = store.dispatch(singleInstanceThunk(43)); // Different from promise1 and promise2

        jest.advanceTimersByTime(100);

        // Check results for the same parameter instances
        const result1 = await promise1;
        const result2 = await promise2;
        expect(result1.payload).toBe(42);
        expect(result2.payload).toBe(42);
        expect(result1.payload).toEqual(result2.payload);

        // Check result for different parameter instance
        const result3 = await promise3;
        expect(result3.payload).toBe(43);
        expect(result3.payload).not.toEqual(result1.payload);

        // Verify the payload creator was called twice, once for each unique parameter set
        expect(fakeAsyncThunkPayloadCreator).toHaveBeenCalledTimes(2);
    });
});
