import { RuleTester } from 'eslint';
import path from 'node:path';
import { parser } from 'typescript-eslint';

import { enforceNamedContractsRule } from './rule';

const ruleTester = new RuleTester({
    languageOptions: {
        parser,
        parserOptions: {
            ecmaVersion: 2020,
            projectService: {
                allowDefaultProject: ['named-contracts.ts'],
            },
            sourceType: 'module',
            tsconfigRootDir: path.join(__dirname, '../..'),
        },
    },
});

const filename = path.join(__dirname, '../..', 'named-contracts.ts');

ruleTester.run('enforce-named-contracts', enforceNamedContractsRule, {
    valid: [
        {
            filename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;

                const dependencyFreeThunk = createThunk<void, void, void>('test', () => undefined);
            `,
        },
        {
            filename,
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
            filename,
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
            filename,
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
            filename,
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
            filename,
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
            filename,
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
        {
            filename,
            code: `
                type SaveDeps = { logger: { log: () => void } };

                type Save = () => void;

                const createSave = (deps: SaveDeps): Save => () => deps.logger.log();
            `,
        },
        {
            filename,
            code: `
                type SaveDeps = { logger: { log: () => void } };

                type Save = () => void;

                function createSave(deps: SaveDeps): Save {
                    return () => deps.logger.log();
                }
            `,
        },
        {
            filename,
            code: `
                type NativeAppDeps = { logger: { log: () => void } };
                type NativeServices = { save: () => void };

                const createNativeCompositionRoot = (deps: NativeAppDeps): NativeServices => ({
                    save: () => deps.logger.log(),
                });
            `,
        },
        {
            filename,
            code: `
                const createMockDeps = <T>(deps: T): T => deps;
            `,
        },
    ],
    invalid: [
        {
            filename,
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
                    data: { previousName: 'SaveThunkState', nextName: 'SaveThunkDeps' },
                },
                {
                    messageId: 'contractMustBeSeparated',
                    data: { previousName: 'SaveThunkDeps', nextName: 'saveThunk' },
                },
            ],
        },
        {
            filename,
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
            filename,
            code: `
                type SaveDeps = { logger: { log: () => void } };
                type Save = () => void;
                const createSave = (deps: SaveDeps): Save => () => deps.logger.log();
            `,
            output: `
                type SaveDeps = { logger: { log: () => void } };

                type Save = () => void;

                const createSave = (deps: SaveDeps): Save => () => deps.logger.log();
            `,
            errors: [
                {
                    messageId: 'contractMustBeSeparated',
                    data: { previousName: 'SaveDeps', nextName: 'Save' },
                },
                {
                    messageId: 'contractMustBeSeparated',
                    data: { previousName: 'Save', nextName: 'createSave' },
                },
            ],
        },
        {
            filename,
            code: `
                type Save = () => void;

                type SaveDeps = { logger: { log: () => void } };

                const createSave = (deps: SaveDeps): Save => () => deps.logger.log();
            `,
            errors: [
                {
                    messageId: 'dependencyFactoryContractOrder',
                    data: {
                        depsName: 'SaveDeps',
                        serviceName: 'Save',
                        factoryName: 'createSave',
                    },
                },
            ],
        },
        {
            filename,
            code: `
                declare const createThunk: <Result, Payload, Config = void>(name: string, callback: unknown) => unknown;
                const saveThunk = createThunk<void, void>('save', () => undefined);
            `,
            errors: [{ messageId: 'missingThunkConfig', data: { thunkName: 'saveThunk' } }],
        },
        {
            filename,
            code: `
                declare const createThunk: <Result, Payload, Config>(name: string, callback: unknown) => unknown;
                const saveThunk = createThunk<void, void, {}>('save', () => undefined);
            `,
            errors: [{ messageId: 'emptyThunkConfig', data: { thunkName: 'saveThunk' } }],
        },
        {
            filename,
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
            filename,
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
            filename,
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
            filename,
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
            filename,
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
            filename,
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
        {
            filename,
            code: `
                type CreateSaveDeps = { logger: { log: () => void } };
                type Save = () => void;

                const createSave = (deps: CreateSaveDeps): Save => () => deps.logger.log();
            `,
            errors: [
                {
                    messageId: 'contractMustBeNamed',
                    data: { contractName: 'SaveDeps', consumerName: 'createSave' },
                },
            ],
        },
        {
            filename,
            code: `
                type SaveDeps = { logger: { log: () => void } };

                const createSave = (deps: SaveDeps) => () => deps.logger.log();
            `,
            errors: [
                {
                    messageId: 'dependencyFactoryReturnType',
                    data: { factoryName: 'createSave' },
                },
            ],
        },
        {
            filename,
            code: `
                type SaveDeps = { logger: { log: () => void } };

                type Save = () => void;

                const createSave = ({ logger }: SaveDeps): Save => () => logger.log();
            `,
            errors: [
                {
                    messageId: 'dependencyFactoryParameter',
                    data: { factoryName: 'createSave', contractName: 'SaveDeps' },
                },
            ],
        },
    ],
} as Parameters<typeof ruleTester.run>[2]);
