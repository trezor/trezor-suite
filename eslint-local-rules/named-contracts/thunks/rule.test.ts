import { enforceThunkContractsRule } from './rule';
import { namedContractsFilename, namedContractsRuleTester } from '../testUtils';

namedContractsRuleTester.run('enforce-thunk-contracts', enforceThunkContractsRule, {
    valid: [
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                const dependencyFreeThunk = createThunk<void, void, void>('test', () => undefined);
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                type SaveThunkState = { value: string };

                type SaveThunkDeps = { save: () => void };

                const saveThunk = createThunk<
                    void,
                    void,
                    { state: SaveThunkState; extra: SaveThunkDeps }
                >('save', () => undefined);
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                type SaveThunkState = { value: string };

                type SaveThunkDeps = { save: () => void };

                type SaveThunkDispatch = (action: unknown) => void;

                const saveThunk = createThunk<
                    void,
                    void,
                    { state: SaveThunkState; extra: SaveThunkDeps }
                >('save', () => undefined);
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                type SaveThunkState = { value: string };

                const saveThunks = createThunk<void, void, { state: SaveThunkState }>(
                    'save',
                    () => undefined,
                );
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                type SaveThunkState = { value: string };

                const saveThunkInner = createThunk<void, void, { state: SaveThunkState }>(
                    'save',
                    () => undefined,
                );
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                type SaveThunkState = { value: string };

                type SaveThunkDeps = { save: () => void };

                const save = () => (
                    dispatch: unknown,
                    getState: () => SaveThunkState,
                    extra: SaveThunkDeps,
                ) => {
                    void dispatch;
                    void getState;
                    void extra;
                };
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                type SaveThunkState = { value: string };

                type SaveThunkDeps = { save: () => void };

                function save() {
                    return (
                        dispatch: unknown,
                        getState: () => SaveThunkState,
                        extra: SaveThunkDeps,
                    ) => {
                        void dispatch;
                        void getState;
                        void extra;
                    };
                }
            `,
        },
    ],
    invalid: [
        {
            filename: namedContractsFilename,
            code: `
                type GetState = () => { value: string };

                type SaveThunkState = ReturnType<GetState>;

                const save = () => (
                    dispatch: unknown,
                    getState: () => SaveThunkState,
                ) => {
                    void dispatch;
                    void getState;
                };
            `,
            errors: [
                {
                    messageId: 'stateContractMustBeExplicit',
                    data: { contractName: 'SaveThunkState' },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                type AppState = { value: string };

                type SaveThunkState = AppState;

                const save = () => (
                    dispatch: unknown,
                    getState: () => SaveThunkState,
                ) => {
                    void dispatch;
                    void getState;
                };
            `,
            errors: [
                {
                    messageId: 'stateContractMustBeExplicit',
                    data: { contractName: 'SaveThunkState' },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;
                type SaveThunkState = { value: string };
                type SaveThunkDeps = { save: () => void };
                const saveThunk = createThunk<
                    void,
                    void,
                    { state: SaveThunkState; extra: SaveThunkDeps }
                >('save', () => undefined);
            `,
            output: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                type SaveThunkState = { value: string };

                type SaveThunkDeps = { save: () => void };

                const saveThunk = createThunk<
                    void,
                    void,
                    { state: SaveThunkState; extra: SaveThunkDeps }
                >('save', () => undefined);
            `,
            errors: [
                {
                    messageId: 'contractMustBeSeparated',
                    data: {
                        previousName: 'the previous declaration',
                        nextName: 'SaveThunkState',
                    },
                },
                {
                    messageId: 'contractMustBeSeparated',
                    data: { previousName: 'SaveThunkState', nextName: 'SaveThunkDeps' },
                },
                {
                    messageId: 'contractMustBeSeparated',
                    data: { previousName: 'SaveThunkDeps', nextName: 'saveThunk' },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                type SaveThunkDeps = { save: () => void };

                type SaveThunkState = { value: string };

                const saveThunk = createThunk<
                    void,
                    void,
                    { state: SaveThunkState; extra: SaveThunkDeps }
                >('save', () => undefined);
            `,
            output: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                type SaveThunkState = { value: string };

                type SaveThunkDeps = { save: () => void };

                const saveThunk = createThunk<
                    void,
                    void,
                    { state: SaveThunkState; extra: SaveThunkDeps }
                >('save', () => undefined);
            `,
            errors: [
                {
                    messageId: 'contractOrder',
                    data: {
                        stateName: 'SaveThunkState',
                        depsName: 'SaveThunkDeps',
                        consumerName: 'saveThunk',
                    },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                export type SaveThunkDeps = { save: () => void };

                export type SaveThunkState = { value: string };

                export const saveThunk = createThunk<
                    void,
                    void,
                    { state: SaveThunkState; extra: SaveThunkDeps }
                >('save', () => undefined);
            `,
            output: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                export type SaveThunkState = { value: string };

                export type SaveThunkDeps = { save: () => void };

                export const saveThunk = createThunk<
                    void,
                    void,
                    { state: SaveThunkState; extra: SaveThunkDeps }
                >('save', () => undefined);
            `,
            errors: [
                {
                    messageId: 'contractOrder',
                    data: {
                        stateName: 'SaveThunkState',
                        depsName: 'SaveThunkDeps',
                        consumerName: 'saveThunk',
                    },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                // Saving requires access to this service.
                type SaveThunkDeps = { save: () => void };

                type SaveThunkState = { value: string };

                const saveThunk = createThunk<
                    void,
                    void,
                    { state: SaveThunkState; extra: SaveThunkDeps }
                >('save', () => undefined);
            `,
            output: null,
            errors: [
                {
                    messageId: 'contractOrder',
                    data: {
                        stateName: 'SaveThunkState',
                        depsName: 'SaveThunkDeps',
                        consumerName: 'saveThunk',
                    },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config = void>(name: string, callback: unknown) => unknown;
                const saveThunk = createThunk<void, void>('save', () => undefined);
            `,
            errors: [{ messageId: 'missingThunkConfig', data: { thunkName: 'saveThunk' } }],
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;
                const saveThunk = createThunk<void, void, {}>('save', () => undefined);
            `,
            errors: [{ messageId: 'emptyThunkConfig', data: { thunkName: 'saveThunk' } }],
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;
                type State = { value: string };
                type Deps = { save: () => void };

                const saveThunk = createThunk<void, void, { state: State; extra: Deps }>(
                    'save',
                    () => undefined,
                );
            `,
            errors: [
                { messageId: 'contractMustBeNamed', data: { contractName: 'SaveThunkState' } },
                { messageId: 'contractMustBeNamed', data: { contractName: 'SaveThunkDeps' } },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;
                type SaveThunkState = { value: string };
                const unrelated = true;

                const saveThunk = createThunk<void, void, { state: SaveThunkState }>(
                    'save',
                    () => unrelated,
                );
            `,
            errors: [
                {
                    messageId: 'contractMustBeAdjacent',
                    data: { contractName: 'SaveThunkState', consumerName: 'saveThunk' },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                type SaveThunkDeps = { save: () => void };

                const saveThunk = createThunk<void, void, { state: void; extra: SaveThunkDeps }>(
                    'save',
                    () => undefined,
                );
            `,
            errors: [
                {
                    messageId: 'voidContractProperty',
                    data: { propertyName: 'state', thunkName: 'saveThunk' },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                type State = { value: string };
                type Deps = { save: () => void };

                const save = () => (
                    dispatch: unknown,
                    getState: () => State,
                    extra: Deps,
                ) => {
                    void dispatch;
                    void getState;
                    void extra;
                };
            `,
            errors: [
                { messageId: 'contractMustBeNamed', data: { contractName: 'SaveThunkState' } },
                { messageId: 'contractMustBeNamed', data: { contractName: 'SaveThunkDeps' } },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                const save = () => (dispatch, getState, extra) => {
                    void dispatch;
                    void getState;
                    void extra;
                };
            `,
            errors: [
                { messageId: 'contractMustBeNamed', data: { contractName: 'SaveThunkState' } },
                { messageId: 'contractMustBeNamed', data: { contractName: 'SaveThunkDeps' } },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                const save = () => (_, getState, extra) => {
                    void getState;
                    void extra;
                };
            `,
            errors: [
                { messageId: 'contractMustBeNamed', data: { contractName: 'SaveThunkState' } },
                { messageId: 'contractMustBeNamed', data: { contractName: 'SaveThunkDeps' } },
            ],
        },
    ],
} as Parameters<typeof namedContractsRuleTester.run>[2]);
