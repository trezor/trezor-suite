import { RuleTester } from 'eslint';
import { parser } from 'typescript-eslint';

import { enforceThunkNamesRule } from './rule';

const typescriptRuleTester = new RuleTester({
    languageOptions: {
        parser,
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
    },
});

typescriptRuleTester.run('enforce-thunk-names', enforceThunkNamesRule, {
    valid: [
        {
            code: `
                declare const createThunk: (...args: unknown[]) => unknown;
                const saveThunk = createThunk('save', () => undefined);
            `,
        },
        {
            code: `
                declare const createSingleInstanceThunk: (...args: unknown[]) => unknown;
                const saveThunk = createSingleInstanceThunk('save', () => undefined);
            `,
        },
        {
            code: `
                const saveThunk = () => (dispatch: unknown, getState: () => unknown) => {
                    void dispatch;
                    void getState;
                };
            `,
        },
        {
            code: `
                function saveThunk() {
                    return (dispatch: unknown, getState: () => unknown, extra: unknown) => {
                        void dispatch;
                        void getState;
                        void extra;
                    };
                }
            `,
        },
        {
            code: `
                const save = () => (value: unknown) => value;
                const createThunk = () => undefined;
            `,
        },
    ],
    invalid: [
        {
            code: `
                declare const createThunk: (...args: unknown[]) => unknown;
                const save = createThunk('save', () => undefined);
            `,
            output: `
                declare const createThunk: (...args: unknown[]) => unknown;
                const saveThunk = createThunk('save', () => undefined);
            `,
            errors: [{ messageId: 'missingThunkSuffix', data: { thunkName: 'save' } }],
        },
        {
            code: `
                declare const createSingleInstanceThunk: (...args: unknown[]) => unknown;
                const save = createSingleInstanceThunk('save', () => undefined);
            `,
            output: `
                declare const createSingleInstanceThunk: (...args: unknown[]) => unknown;
                const saveThunk = createSingleInstanceThunk('save', () => undefined);
            `,
            errors: [{ messageId: 'missingThunkSuffix', data: { thunkName: 'save' } }],
        },
        {
            code: `
                const save = () => (dispatch: unknown, getState: () => unknown) => {
                    void dispatch;
                    void getState;
                };
            `,
            output: `
                const saveThunk = () => (dispatch: unknown, getState: () => unknown) => {
                    void dispatch;
                    void getState;
                };
            `,
            errors: [{ messageId: 'missingThunkSuffix', data: { thunkName: 'save' } }],
        },
        {
            code: `
                const save = () => {
                    return (_: unknown, _getState: () => unknown, extra: unknown) => {
                        void extra;
                    };
                };
            `,
            output: `
                const saveThunk = () => {
                    return (_: unknown, _getState: () => unknown, extra: unknown) => {
                        void extra;
                    };
                };
            `,
            errors: [{ messageId: 'missingThunkSuffix', data: { thunkName: 'save' } }],
        },
        {
            code: `
                function save() {
                    return (dispatch: unknown, getState: () => unknown) => {
                        void dispatch;
                        void getState;
                    };
                }
            `,
            output: `
                function saveThunk() {
                    return (dispatch: unknown, getState: () => unknown) => {
                        void dispatch;
                        void getState;
                    };
                }
            `,
            errors: [{ messageId: 'missingThunkSuffix', data: { thunkName: 'save' } }],
        },
        {
            code: `
                function run() {
                    const save = () => (dispatch: unknown, getState: () => unknown) => {
                        void dispatch;
                        void getState;
                    };

                    return save;
                }
            `,
            output: `
                function run() {
                    const saveThunk = () => (dispatch: unknown, getState: () => unknown) => {
                        void dispatch;
                        void getState;
                    };

                    return saveThunk;
                }
            `,
            errors: [{ messageId: 'missingThunkSuffix', data: { thunkName: 'save' } }],
        },
        {
            code: `
                declare const createThunk: (...args: unknown[]) => unknown;
                const save = createThunk('save', () => undefined);
                const actions = { save };
                void actions;
            `,
            output: `
                declare const createThunk: (...args: unknown[]) => unknown;
                const saveThunk = createThunk('save', () => undefined);
                const actions = { save: saveThunk };
                void actions;
            `,
            errors: [{ messageId: 'missingThunkSuffix', data: { thunkName: 'save' } }],
        },
        {
            code: `
                declare const createThunk: (...args: unknown[]) => unknown;
                const saveThunks = createThunk('save', () => undefined);
            `,
            output: `
                declare const createThunk: (...args: unknown[]) => unknown;
                const saveThunk = createThunk('save', () => undefined);
            `,
            errors: [{ messageId: 'missingThunkSuffix', data: { thunkName: 'saveThunks' } }],
        },
        {
            code: `
                declare const createThunk: (...args: unknown[]) => unknown;
                const saveThunkInner = createThunk('save', () => undefined);
            `,
            output: `
                declare const createThunk: (...args: unknown[]) => unknown;
                const saveThunk = createThunk('save', () => undefined);
            `,
            errors: [{ messageId: 'missingThunkSuffix', data: { thunkName: 'saveThunkInner' } }],
        },
        {
            code: `
                declare const createThunk: (...args: unknown[]) => unknown;
                const saveThunk = createThunk('existing', () => undefined);
                const save = createThunk('save', () => undefined);
                void save;
            `,
            output: null,
            errors: [{ messageId: 'missingThunkSuffix', data: { thunkName: 'save' } }],
        },
    ],
} as Parameters<typeof typescriptRuleTester.run>[2]);
