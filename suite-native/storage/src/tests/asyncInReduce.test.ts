// This is just a demonstrations why we should not use createMigrate util from redux-persist together with async functions.
// Check the implementation of createMigrate here https://github.com/rt2zz/redux-persist/blob/d8b01a085e3679db43503a3858e8d4759d6f22fa/src/createMigrate.ts#L44-L51

const helperFunctionUsingReduce = (
    initialState: any,
    objectOfFunctions: Record<string, (state: any) => any>,
) => {
    const keys = Object.keys(objectOfFunctions)
        .map(ver => parseInt(ver))
        .sort((a, b) => a - b);

    const migratedState = keys.reduce((state, key) => objectOfFunctions[key](state), initialState);

    return migratedState;
};

const delay = (ms: number) => jest.advanceTimersByTime(ms);

describe('Function using reduce on object of functions', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers(); // Ensure all timers are flushed
        jest.useRealTimers(); // Restore real timers after each test
    });

    const initialState = { a: 0, b: 0, c: 0 };

    it('works just fine for sync functions', () => {
        const objectOfFunctions = {
            1: (state: any) => ({ ...state, a: 1 }),
            2: (state: any) => ({ ...state, b: 2 }),
            3: (state: any) => ({ ...state, c: 3 }),
        };

        const expectedResult = { a: 1, b: 2, c: 3 };

        const result = helperFunctionUsingReduce(initialState, objectOfFunctions);

        expect(result).toEqual(expectedResult);
    });

    it('breaks with async functions', () => {
        const objectOfFunctions = {
            1: (state: any) => ({ ...state, a: 1 }),
            2: async (state: any) => {
                await delay(100);

                return { ...state, b: 2 };
            },
            3: (state: any) => ({ ...state, c: 3 }),
        };

        const expectedResult = { a: 1, b: 2, c: 3 };
        const unexpectedResult = { c: 3 };

        const result = helperFunctionUsingReduce(initialState, objectOfFunctions);

        expect(result).not.toEqual(expectedResult);
        expect(result).toEqual(unexpectedResult);
    });
});
