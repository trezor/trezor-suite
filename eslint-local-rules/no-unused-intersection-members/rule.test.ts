import { RuleTester } from 'eslint';
import path from 'node:path';
import { parser } from 'typescript-eslint';

import { noUnusedIntersectionMembersRule } from './rule';

const typeAwareRuleTester = new RuleTester({
    languageOptions: {
        parser,
        parserOptions: {
            ecmaVersion: 2020,
            projectService: {
                allowDefaultProject: ['unused-intersection-member.ts'],
            },
            sourceType: 'module',
            tsconfigRootDir: path.join(__dirname, '../..'),
        },
    },
});

const typeAwareTestFilename = path.join(__dirname, '../..', 'unused-intersection-member.ts');

typeAwareRuleTester.run('no-unused-intersection-members', noUnusedIntersectionMembersRule, {
    valid: [
        {
            name: 'accepts when every direct intersection member is used',
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
            name: 'accepts when every member contributes through a shared services path',
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
            name: 'accepts when every WithServices dependency is used',
            filename: typeAwareTestFilename,
            code: `
                    type WithServices<Services extends object> = { services: Services };
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type RunDeps = WithServices<LoggerDep & StorageDep>;

                    const run = (deps: RunDeps) => {
                        deps.services.logger.log();
                        deps.services.storage.save();
                    };
                `,
        },
        {
            name: 'combines state requirements from a selector and direct access',
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
            name: 'combines dependency requirements from a consumer and direct access',
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
            name: 'accepts when every nested intersection member is used',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type RunDeps = { services: LoggerDep & StorageDep };

                    const run = (deps: RunDeps) => {
                        deps.services.logger.log();
                        deps.services.storage.save();
                    };
                `,
        },
        {
            name: 'accepts when every object contract member is used',
            filename: typeAwareTestFilename,
            code: `
                    type RunDeps = {
                        logger: { log: () => void };
                        storage: { save: () => void };
                    };

                    const run = (deps: RunDeps) => {
                        deps.logger.log();
                        deps.storage.save();
                    };
                `,
        },
        {
            name: 'ignores object-shaped State aliases without state-role usage',
            filename: typeAwareTestFilename,
            code: `
                    type SendState = {
                        drafts: Record<string, unknown>;
                        serializedTransaction?: string;
                    };

                    const getDrafts = (state: SendState) => state.drafts;
                `,
        },
        {
            name: 'ignores aliases without a recognized suffix or usage role',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: () => void } };
                    type StorageDeps = { storage: { save: () => void } };
                    type UnrelatedContract = LoggerDeps & StorageDeps;

                    const run = (deps: UnrelatedContract) => deps.logger.log();
                `,
        },
        {
            name: 'ignores custom suffixes unless configured or discovered from usage',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type RunContext = LoggerDep & StorageDep;

                    const run = (context: RunContext) => context.logger.log();
                `,
        },
        {
            name: 'preserves contracts consumed in type-level positions',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type RunDeps = LoggerDep & StorageDep;
                    type RunKeys = keyof RunDeps;
                    type RunStorage = RunDeps['storage'];
                    type PublicRunContract = RunDeps;

                    const run = (deps: RunDeps) => deps.logger.log();
                    declare const key: RunKeys;
                    declare const storage: RunStorage;
                    declare const publicDeps: PublicRunContract;
                `,
        },
        {
            name: 'preserves contracts accessed through dynamic keys',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: () => void } };
                    type StorageDeps = { storage: { save: () => void } };
                    type RunDeps = LoggerDeps & StorageDeps;

                    const run = (deps: RunDeps, key: keyof RunDeps) => deps[key];
                `,
        },
        {
            name: 'preserves ambiguous members with overlapping properties',
            filename: typeAwareTestFilename,
            code: `
                    type FirstDeps = { logger: { log: () => void } };
                    type SecondDeps = { logger: { log: () => void } };
                    type RunDeps = FirstDeps & SecondDeps;

                    const run = (deps: RunDeps) => deps.logger.log();
                `,
        },
        {
            name: 'preserves contracts wrapped by an unknown generic',
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
            name: 'preserves state contracts passed as generic arguments',
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
            name: 'combines direct thunk usage with dispatched child requirements',
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
        {
            name: 'accounts for WithServices requirements of dispatched child thunks',
            filename: typeAwareTestFilename,
            code: `
                    type WithServices<Services extends object> = { services: Services };
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type ParentDeps = WithServices<LoggerDep & StorageDep>;
                    type ChildAction = (
                        dispatch: unknown,
                        getState: () => unknown,
                        extra: WithServices<StorageDep>,
                    ) => void;

                    declare const childThunk: () => ChildAction;
                    declare const createThunk: <Result, Payload, Config>(
                        name: string,
                        callback: (
                            payload: Payload,
                            api: {
                                dispatch: (action: ChildAction) => unknown;
                                extra: Config extends { extra: infer Deps } ? Deps : never;
                            },
                        ) => Result,
                    ) => unknown;

                    createThunk<void, void, { extra: ParentDeps }>(
                        'parent',
                        (_, { dispatch, extra }) => {
                            extra.services.logger.log();
                            dispatch(childThunk());
                        },
                    );
                `,
        },
        {
            name: 'accounts for dispatched child requirements in vanilla thunks',
            filename: typeAwareTestFilename,
            code: `
                    type WithServices<Services extends object> = { services: Services };
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type ParentDeps = WithServices<LoggerDep & StorageDep>;
                    type ChildAction = (
                        dispatch: unknown,
                        getState: () => unknown,
                        extra: WithServices<StorageDep>,
                    ) => void;

                    declare const childThunk: () => ChildAction;

                    const parentThunk = () =>
                        (
                            dispatch: (action: ChildAction) => unknown,
                            _getState: () => unknown,
                            extra: ParentDeps,
                        ) => {
                            extra.services.logger.log();
                            dispatch(childThunk());
                        };
                `,
        },
        {
            name: 'preserves members captured by rest destructuring',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: () => void } };
                    type StorageDeps = { storage: { save: () => void } };
                    type RunDeps = LoggerDeps & StorageDeps;

                    const run = ({ logger, ...remainingDeps }: RunDeps) => {
                        logger.log();
                        return remainingDeps;
                    };
                `,
        },
    ],
    invalid: [
        {
            name: 'reports an unused direct intersection member',
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
            name: 'reports an unused nested intersection member after destructuring',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type RunDeps = { services: LoggerDep & StorageDep };

                    declare const deps: RunDeps;
                    const { logger } = deps.services;
                    logger.log();
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'StorageDep', typeName: 'RunDeps' },
                },
            ],
        },
        {
            name: 'reports a state member not required by a narrower selector',
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
            name: 'reports multiple unused members under a shared services path',
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
            name: 'reports an unused WithServices dependency',
            filename: typeAwareTestFilename,
            code: `
                    type WithServices<Services extends object> = { services: Services };
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type RunDeps = WithServices<LoggerDep & StorageDep>;

                    const run = (deps: RunDeps) => deps.services.logger.log();
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'StorageDep', typeName: 'RunDeps' },
                },
            ],
        },
        {
            name: 'reports an unused WithServices dependency beside root members',
            filename: typeAwareTestFilename,
            code: `
                    type WithServices<Services extends object> = { services: Services };
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type RunDeps = WithServices<LoggerDep & StorageDep> & {
                        thunks: { finish: () => void };
                    };

                    const run = (deps: RunDeps) => {
                        deps.services.logger.log();
                        deps.thunks.finish();
                    };
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'StorageDep', typeName: 'RunDeps' },
                },
            ],
        },
        {
            name: 'reports parent state unused by both parent and child thunks',
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
        {
            name: 'reports an unused member with parameter destructuring',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: () => void } };
                    type StorageDeps = { storage: { save: () => void } };
                    type RunDeps = LoggerDeps & StorageDeps;

                    const run = ({ logger }: RunDeps) => logger.log();
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'StorageDeps', typeName: 'RunDeps' },
                },
            ],
        },
        {
            name: 'reports an unused member with nested parameter destructuring',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDep = { services: { logger: { log: () => void } } };
                    type StorageDep = { services: { storage: { save: () => void } } };
                    type RunDeps = LoggerDep & StorageDep;

                    declare const deps: RunDeps;
                    const { services: { logger: serviceLogger } } = deps;
                    serviceLogger.log();
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'StorageDep', typeName: 'RunDeps' },
                },
            ],
        },
        {
            name: 'reports an unused nested intersection member after property access',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type RunDeps = { services: LoggerDep & StorageDep };

                    const run = (deps: RunDeps) => deps.services.logger.log();
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'StorageDep', typeName: 'RunDeps' },
                },
            ],
        },
        {
            name: 'reports a nested member not required by a narrower consumer',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type RunDeps = { services: LoggerDep & StorageDep };

                    declare const useLogger: (deps: { services: LoggerDep }) => void;
                    const run = (deps: RunDeps) => useLogger(deps);
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'StorageDep', typeName: 'RunDeps' },
                },
            ],
        },
        {
            name: 'reports an unused object contract member',
            filename: typeAwareTestFilename,
            code: `
                    type RunDeps = {
                        logger: { log: () => void };
                        storage: { save: () => void };
                    };

                    const run = (deps: RunDeps) => deps.logger.log();
                `,
            errors: [
                {
                    messageId: 'unusedContractMember',
                    data: { memberName: 'storage', typeName: 'RunDeps' },
                },
            ],
        },
        {
            name: 'reports an unused nested object member after destructuring',
            filename: typeAwareTestFilename,
            code: `
                    type RunDeps = {
                        services: {
                            logger: { log: () => void };
                            storage: { save: () => void };
                        };
                    };

                    const run = ({ services: { logger } }: RunDeps) => logger.log();
                `,
            errors: [
                {
                    messageId: 'unusedContractMember',
                    data: { memberName: 'storage', typeName: 'RunDeps' },
                },
            ],
        },
        {
            name: 'reports an object member not required by a narrower consumer',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: () => void } };
                    type RunDeps = {
                        logger: { log: () => void };
                        storage: { save: () => void };
                    };

                    declare const useLogger: (deps: LoggerDeps) => void;
                    const run = (deps: RunDeps) => useLogger(deps);
                `,
            errors: [
                {
                    messageId: 'unusedContractMember',
                    data: { memberName: 'storage', typeName: 'RunDeps' },
                },
            ],
        },
        {
            name: 'reports an unused inline object intersection member',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDeps = { logger: { log: () => void } };
                    type RunDeps = LoggerDeps & {
                        storage: { save: () => void };
                    };

                    const run = (deps: RunDeps) => deps.logger.log();
            `,
            errors: [{ messageId: 'unusedIntersectionMember' }],
        },
        {
            name: 'reports only provably unused extras when dispatch escapes',
            filename: typeAwareTestFilename,
            code: `
                    type ServiceDeps = { services: { logger: { log: () => void } } };
                    type RunDeps = {
                        services: { logger: { log: () => void } };
                        thunks: { run: () => void };
                        storage: { save: () => void };
                    };
                    type ChildAction = (
                        dispatch: unknown,
                        getState: () => unknown,
                        extra: ServiceDeps,
                    ) => void;

                    declare const complete: (api: {
                        dispatch: (action: ChildAction) => unknown;
                    }) => void;
                    declare const createThunk: <Result, Payload, Config>(
                        name: string,
                        callback: (
                            payload: Payload,
                            api: {
                                dispatch: (action: ChildAction) => unknown;
                                extra: Config extends { extra: infer Deps } ? Deps : never;
                            },
                        ) => Result,
                    ) => unknown;

                    createThunk<void, void, { extra: RunDeps }>(
                        'run',
                        (_, { dispatch, extra }) => {
                            complete({ dispatch });
                            extra.thunks.run();
                        },
                    );
                `,
            errors: [
                {
                    messageId: 'unusedContractMember',
                    data: { memberName: 'storage', typeName: 'RunDeps' },
                },
            ],
        },
        {
            name: 'supports configured contract name suffixes',
            filename: typeAwareTestFilename,
            options: [{ additionalTypeNameSuffixes: ['Context'] }],
            code: `
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type RunContext = LoggerDep & StorageDep;

                    const run = (context: RunContext) => context.logger.log();
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'StorageDep', typeName: 'RunContext' },
                },
            ],
        },
        {
            name: 'discovers dependency contracts from service factory parameters',
            filename: typeAwareTestFilename,
            code: `
                    type LoggerDep = { logger: { log: () => void } };
                    type StorageDep = { storage: { save: () => void } };
                    type ServiceContext = LoggerDep & StorageDep;

                    const createService = (deps: ServiceContext) => () => deps.logger.log();
                `,
            errors: [
                {
                    messageId: 'unusedIntersectionMember',
                    data: { memberName: 'StorageDep', typeName: 'ServiceContext' },
                },
            ],
        },
        {
            name: 'discovers dependency contracts from createThunk extra configuration',
            filename: typeAwareTestFilename,
            code: `
                    type ExtraContext = {
                        logger: { log: () => void };
                        storage: { save: () => void };
                    };

                    declare const createThunk: <Result, Payload, Config>(
                        name: string,
                        callback: (
                            payload: Payload,
                            api: {
                                dispatch: (action: unknown) => unknown;
                                extra: Config extends { extra: infer Deps } ? Deps : never;
                            },
                        ) => Result,
                    ) => unknown;

                    createThunk<void, void, { extra: ExtraContext }>(
                        'run',
                        (_, { extra }) => extra.logger.log(),
                    );
                `,
            errors: [
                {
                    messageId: 'unusedContractMember',
                    data: { memberName: 'storage', typeName: 'ExtraContext' },
                },
            ],
        },
    ],
} as Parameters<typeof typeAwareRuleTester.run>[2]);
