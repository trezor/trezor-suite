import { RuleTester } from 'eslint';
import path from 'node:path';
import { parser } from 'typescript-eslint';

import { rules } from './rules';

const ruleTester = new RuleTester();

const allowedEntryPointPatterns = [
    /^@suite-common\/bluetooth\/mocks$/,
    /^@suite-common\/thp\/mocks$/,
    /^@suite-common\/test-utils\/globalOverrides$/,
];

ruleTester.run('no-package-deep-imports', rules['no-package-deep-imports'], {
    valid: [
        // Top-level package imports are allowed
        { code: "import { foo } from '@suite-common/wallet-utils';" },
        { code: "import { foo } from '@suite-native/intl';" },
        { code: "import { foo } from '@trezor/utils';" },
        { code: "import { foo } from '@suite/components';" },
        // Mocks entry point is allowed
        {
            code: "import { mock } from '@suite-common/bluetooth/mocks';",
            options: [{ allowedEntryPointPatterns }],
        },
        {
            code: "import { mock } from '@suite-common/thp/mocks';",
            options: [{ allowedEntryPointPatterns }],
        },
        // Non-restricted scopes are allowed regardless of depth
        { code: "import { debounce } from 'lodash/fp';" },
        { code: "import React from 'react';" },
        { code: "import { foo } from '@reduxjs/toolkit/query';" },
        // Re-exports from allowed paths
        { code: "export { foo } from '@suite-common/wallet-utils';" },
        { code: "export * from '@trezor/utils';" },
        // Custom packageScopes option
        {
            code: "import { foo } from '@suite-common/wallet-utils/src/deep';",
            options: [{ packageScopes: ['@custom'] }],
        },
        // Deep imports can be allowed for selected package entry points
        {
            code: "import { connectCallableMethods } from '@trezor/connect/src/factory';",
            options: [{ ignoredPackages: ['@trezor/connect'] }],
        },
        // Explicitly configured package entry points are allowed.
        {
            code: "import '@suite-common/test-utils/globalOverrides';",
            options: [{ allowedEntryPointPatterns }],
        },
    ],
    invalid: [
        // Deep imports from @suite-common
        {
            code: "import { foo } from '@suite-common/wallet-utils/src/amountUtils';",
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-common/wallet-utils/src/amountUtils',
                        packageImportPath: '@suite-common/wallet-utils',
                    },
                },
            ],
        },
        // Deep imports from @trezor
        {
            code: "import { BigNumber } from '@trezor/utils/src/bigNumber';",
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@trezor/utils/src/bigNumber',
                        packageImportPath: '@trezor/utils',
                    },
                },
            ],
        },
        // Deep imports from @suite-native
        {
            code: "import { foo } from '@suite-native/intl/src/getTranslation';",
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-native/intl/src/getTranslation',
                        packageImportPath: '@suite-native/intl',
                    },
                },
            ],
        },
        // Deep mocks imports should suggest the mocks entry point
        {
            code: "import { mock } from '@suite-common/bluetooth/mocks/createBluetoothDeviceCommon';",
            options: [{ allowedEntryPointPatterns }],
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-common/bluetooth/mocks/createBluetoothDeviceCommon',
                        packageImportPath: '@suite-common/bluetooth/mocks',
                    },
                },
            ],
        },
        // Similarly prefixed paths are not entry points.
        {
            code: "import { mock } from '@suite-common/bluetooth/mocksInternal';",
            options: [{ allowedEntryPointPatterns }],
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-common/bluetooth/mocksInternal',
                        packageImportPath: '@suite-common/bluetooth',
                    },
                },
            ],
        },
        // Imports below a configured entry point should suggest the public entry point.
        {
            code: "import '@suite-common/test-utils/globalOverrides/internal';",
            options: [{ allowedEntryPointPatterns }],
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-common/test-utils/globalOverrides/internal',
                        packageImportPath: '@suite-common/test-utils/globalOverrides',
                    },
                },
            ],
        },
        // export * re-exports from deep paths
        {
            code: "export * from '@suite-common/wallet-core/src/send/sendFormThunks';",
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-common/wallet-core/src/send/sendFormThunks',
                        packageImportPath: '@suite-common/wallet-core',
                    },
                },
            ],
        },
        // Named re-exports from deep paths
        {
            code: "export { foo } from '@trezor/connect/src/api/bitcoin';",
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@trezor/connect/src/api/bitcoin',
                        packageImportPath: '@trezor/connect',
                    },
                },
            ],
        },
    ],
});

ruleTester.run('no-suite-imports-in-suite-common', rules['no-suite-imports-in-suite-common'], {
    valid: [
        {
            code: "import { foo } from '@suite-common/wallet-utils';",
            filename: '/repo/suite-common/example/src/file.ts',
        },
        {
            code: "import { foo } from '@trezor/utils';",
            filename: '/repo/suite-common/example/src/file.ts',
        },
        {
            code: "import { foo } from '@suite/intl';",
            filename: '/repo/suite/app/src/file.ts',
        },
        {
            code: "export { foo } from '@suite-common/wallet-utils';",
            filename: '/repo/suite-common/example/src/file.ts',
        },
    ],
    invalid: [
        {
            code: "import { TranslationKey } from '@suite/intl';",
            filename: '/repo/suite-common/wallet-types/src/transaction.ts',
            errors: [
                {
                    messageId: 'doNotImportSuiteIntoSuiteCommon',
                    data: { sourcePath: '@suite/intl' },
                },
            ],
        },
        {
            code: "import { getTranslation } from '@suite-native/intl';",
            filename: '/repo/suite-common/intl-types/src/file.ts',
            errors: [
                {
                    messageId: 'doNotImportSuiteIntoSuiteCommon',
                    data: { sourcePath: '@suite-native/intl' },
                },
            ],
        },
    ],
});

const typescriptRuleTester = new RuleTester({
    languageOptions: {
        parser,
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
    },
});

typescriptRuleTester.run('analytics-event-name', rules['analytics-event-name'], {
    valid: [
        { code: "export enum EventType { Foo = 'settings/app-log-exported' }" },
        { code: "export enum EventType { Bar = 'dashboard/send-modal' }" },
        { code: "export enum EventType { Baz = 'wallet-connect/init' }" },
        { code: "export enum EventType { A = 'device/connect', B = 'receive/flow-entered' }" },
        { code: "export enum OtherEnum { X = 'anything' }" },
        { code: "const x = 'settings/foo';" },
    ],
    invalid: [
        {
            code: "export enum EventType { Bad = 'coin_discovery' }",
            errors: [{ messageId: 'invalidFormat' }],
        },
        {
            code: "export enum EventType { Bad = 'unknown-domain/event' }",
            errors: [{ messageId: 'invalidDomain', data: { domain: 'unknown-domain' } }],
        },
        {
            code: "export enum EventType { Bad = 'settings/appLogExported' }",
            errors: [{ messageId: 'notKebabCase', data: { eventPart: 'settings/appLogExported' } }],
        },
        {
            code: "export enum EventType { Bad = 'settings/device/change_pin' }",
            errors: [
                {
                    messageId: 'notKebabCase',
                    data: { eventPart: 'settings/device/change_pin' },
                },
            ],
        },
    ],
} as Parameters<typeof typescriptRuleTester.run>[2]);

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

typeAwareRuleTester.run('no-unused-intersection-members', rules['no-unused-intersection-members'], {
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
