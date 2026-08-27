import { RuleTester } from 'eslint';
import path from 'node:path';
import { parser } from 'typescript-eslint';

import { noUnusedIntersectionMembersRule } from './noUnusedIntersectionMembersRule';

const typeAwareRuleTester = new RuleTester({
    languageOptions: {
        parser,
        parserOptions: {
            ecmaVersion: 2020,
            projectService: {
                allowDefaultProject: ['unused-intersection-member.ts'],
            },
            sourceType: 'module',
            tsconfigRootDir: path.join(__dirname, '..'),
        },
    },
});

const typeAwareTestFilename = path.join(__dirname, '..', 'unused-intersection-member.ts');

typeAwareRuleTester.run('no-unused-intersection-members', noUnusedIntersectionMembersRule, {
    valid: [
        {
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: (message: string) => void } };
                    type StorageDeps = { storage: { save: () => void } };
                    type RunDeps = LoggerDeps & StorageDeps;

                    const run = (deps: RunDeps) => {
                        deps.logger.log('started');
                        deps.storage.save();
                    };
                `,
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDep = { services: { logger: { log: () => void } } };
                    type AnalyticsDep = { services: { analytics: { report: () => void } } };
                    type RunDeps = LoggerDep & AnalyticsDep;

                    const run = (deps: RunDeps) => {
                        deps.services.logger.log();
                        deps.services.analytics.report();
                    };
                `,
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type AccountsRootState = { accounts: { selected: string } };
                    type SettingsRootState = { settings: { enabled: boolean } };
                    type RunState = AccountsRootState & SettingsRootState;

                    declare const selectAccount: (state: AccountsRootState) => string;

                    const run = (getState: () => RunState) => {
                        selectAccount(getState());
                        return getState().settings.enabled;
                    };
                `,
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: () => void } };
                    type AnalyticsDeps = { analytics: { report: () => void } };
                    type RunDeps = LoggerDeps & AnalyticsDeps;

                    declare const useLogger: (deps: LoggerDeps) => void;

                    const run = (deps: RunDeps) => {
                        useLogger(deps);
                        deps.analytics.report();
                    };
                `,
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: () => void } };
                    type StorageDeps = { storage: { save: () => void } };
                    type UnrelatedContract = LoggerDeps & StorageDeps;

                    const run = (deps: UnrelatedContract) => deps.logger.log();
                `,
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: () => void } };
                    type StorageDeps = { storage: { save: () => void } };
                    type RunDeps = LoggerDeps & StorageDeps;

                    const run = (deps: RunDeps, key: keyof RunDeps) => deps[key];
                `,
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type FirstDeps = { logger: { log: () => void } };
                    type SecondDeps = { logger: { log: () => void } };
                    type RunDeps = FirstDeps & SecondDeps;

                    const run = (deps: RunDeps) => deps.logger.log();
                `,
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: () => void } };
                    type StorageDeps = { storage: { save: () => void } };
                    type RunDeps = LoggerDeps & StorageDeps;
                    type Generic<Value> = { value: Value };
                    type WrappedDeps = Generic<RunDeps>;

                    const run = (deps: RunDeps) => deps.logger.log();
                    declare const wrapped: WrappedDeps;
                `,
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type AccountsRootState = { accounts: { selected: string } };
                    type SettingsRootState = { settings: { enabled: boolean } };
                    type RunState = AccountsRootState & SettingsRootState;

                    declare const createSelectorFactory: <State>() => unknown;

                    createSelectorFactory<RunState>();

                    const run = (state: RunState) => state.accounts.selected;
                `,
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type LocalState = { local: { ready: boolean } };
                    type ChildState = { child: { ready: boolean } };
                    type LocalDeps = { logger: { log: () => void } };
                    type ChildDeps = { storage: { save: () => void } };
                    type ParentState = LocalState & ChildState;
                    type ParentDeps = LocalDeps & ChildDeps;
                    type ChildAction = (
                        dispatch: unknown,
                        getState: () => ChildState,
                        extra: ChildDeps,
                    ) => void;

                    declare const childThunk: () => ChildAction;
                    declare const createThunk: <Result, Payload, Config>(
                        name: string,
                        callback: (
                            payload: Payload,
                            api: {
                                dispatch: (action: ChildAction) => unknown;
                                getState: () => Config extends { state: infer State } ? State : never;
                                extra: Config extends { extra: infer Deps } ? Deps : never;
                            },
                        ) => Result,
                    ) => unknown;

                    createThunk<void, void, { state: ParentState; extra: ParentDeps }>(
                        'parent',
                        (_, { dispatch, getState, extra }) => {
                            getState().local.ready;
                            extra.logger.log();
                            dispatch(childThunk());
                        },
                    );
                `,
        },
    ],
    invalid: [
        {
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: () => void } };
                    type StorageDeps = { storage: { save: () => void } };
                    type RunDeps = LoggerDeps & StorageDeps;

                    const run = (deps: RunDeps) => deps.logger.log();
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'StorageDeps', typeName: 'RunDeps' },
                },
            ],
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type AccountsRootState = { accounts: { selected: string } };
                    type SettingsRootState = { settings: { enabled: boolean } };
                    type RunState = AccountsRootState & SettingsRootState;

                    declare const selectAccount: (state: AccountsRootState) => string;

                    const run = (getState: () => RunState) => selectAccount(getState());
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'SettingsRootState', typeName: 'RunState' },
                },
            ],
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDep = { services: { logger: { log: () => void } } };
                    type AnalyticsDep = { services: { analytics: { report: () => void } } };
                    type StorageDep = { services: { storage: { save: () => void } } };
                    type RunDeps = LoggerDep & AnalyticsDep & StorageDep;

                    const run = (deps: RunDeps) => deps.services.logger.log();
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'AnalyticsDep', typeName: 'RunDeps' },
                },
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'StorageDep', typeName: 'RunDeps' },
                },
            ],
        },
        {
            filename: typeAwareTestFilename,
            code: `
                    type LocalState = { local: { ready: boolean } };
                    type UnusedState = { unused: { ready: boolean } };
                    type ParentState = LocalState & UnusedState;
                    type ChildAction = (
                        dispatch: unknown,
                        getState: () => LocalState,
                        extra: unknown,
                    ) => void;

                    declare const childThunk: () => ChildAction;
                    declare const createThunk: <Result, Payload, Config>(
                        name: string,
                        callback: (
                            payload: Payload,
                            api: {
                                dispatch: (action: ChildAction) => unknown;
                                getState: () => Config extends { state: infer State } ? State : never;
                            },
                        ) => Result,
                    ) => unknown;

                    createThunk<void, void, { state: ParentState }>(
                        'parent',
                        (_, { dispatch, getState }) => {
                            getState().local.ready;
                            dispatch(childThunk());
                        },
                    );
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'UnusedState', typeName: 'ParentState' },
                },
            ],
        },
    ],
} as Parameters<typeof typeAwareRuleTester.run>[2]);
