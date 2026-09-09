import { enforceDiFactoryContractsRule } from './rule';
import { namedContractsFilename, namedContractsRuleTester } from '../testUtils';

namedContractsRuleTester.run('enforce-di-factory-contracts', enforceDiFactoryContractsRule, {
    valid: [
        {
            filename: namedContractsFilename,
            code: `
                /** @serviceContract */
                interface SharedSave { save: () => void; }

                type ConcreteSaveDeps = { log: () => void };

                const createConcreteSave = (deps: ConcreteSaveDeps): SharedSave => ({ save: deps.log });

                type OtherSaveDeps = { write: () => void };

                const createOtherSave = (deps: OtherSaveDeps): SharedSave => ({ save: deps.write });
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                import type { MockStorage } from './eslint-local-rules/named-contracts/di/mocks/mockServiceContracts';

                type ConcreteStorageDeps = { log: () => void };

                const createConcreteStorage = (deps: ConcreteStorageDeps): MockStorage => ({ save: deps.log });
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                type SaveDeps = { logger: { log: () => void } };

                type Save = () => void;

                const createSave = (deps: SaveDeps): Save => () => deps.logger.log();
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                type SaveDeps = { logger: { log: () => void } };

                type Save = () => void;

                function createSave(deps: SaveDeps): Save {
                    return () => deps.logger.log();
                }
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                type CreateSaveFactoryDeps = { logger: { log: () => void } };

                type SaveFactory = () => () => void;

                type SaveFactoryDep = { saveFactory: SaveFactory };

                const createSaveFactory = (deps: CreateSaveFactoryDeps): SaveFactory =>
                    () => () => deps.logger.log();
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                type MMKVStorageDeps = { getEncryptionKey: () => string };

                type MMKVStorage = { get: () => string };

                type MMKVStorageDep = { mmkvStorage: MMKVStorage };

                const createMMKVStorage = (deps: MMKVStorageDeps): MMKVStorage => ({
                    get: deps.getEncryptionKey,
                });
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                type NativeAppDeps = { logger: { log: () => void } };
                type NativeServices = { save: () => void };

                const createNativeCompositionRoot = (deps: NativeAppDeps): NativeServices => ({
                    save: () => deps.logger.log(),
                });
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                const createMockDeps = <T>(deps: T): T => deps;
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                type ConcreteSaveDeps = { logger: { log: () => void } };

                /** @serviceContract */
                type AbstractSave = () => void;

                const createConcreteSave = (deps: ConcreteSaveDeps): AbstractSave =>
                    () => deps.logger.log();
            `,
        },
        {
            filename: namedContractsFilename,
            code: `
                import type { MockResolveNamedAddress as ResolveNamedAddress } from './eslint-local-rules/named-contracts/di/mocks/mockServiceContractExports';

                type ResolveViaBlockbookDeps = { lookup: (value: string) => Promise<string | null> };

                const createResolveViaBlockbook =
                    (deps: ResolveViaBlockbookDeps): ResolveNamedAddress =>
                    value => deps.lookup(value);

                type ResolveOnchainDeps = { resolve: (value: string) => Promise<string | null> };

                function createResolveOnchain(deps: ResolveOnchainDeps): ResolveNamedAddress {
                    return value => deps.resolve(value);
                }
            `,
        },
    ],
    invalid: [
        {
            filename: namedContractsFilename,
            code: `
                type ConcreteSaveDeps = { log: () => void };

                type UnmarkedSave = () => void;

                /** @serviceContract */
                const createConcreteSave = (deps: ConcreteSaveDeps): UnmarkedSave => deps.log;
            `,
            errors: [
                {
                    messageId: 'contractMustBeNamed',
                    data: { contractName: 'ConcreteSave', consumerName: 'createConcreteSave' },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                import type { MissingService } from './missing-service';

                type ConcreteSaveDeps = { log: () => void };

                const createConcreteSave = (deps: ConcreteSaveDeps): MissingService => deps.log;
            `,
            errors: [
                {
                    messageId: 'contractMustBeNamed',
                    data: { contractName: 'ConcreteSave', consumerName: 'createConcreteSave' },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                type ConcreteSaveDeps = { logger: { log: () => void } };

                type BadlyNamedSave = () => void;

                const createConcreteSave = (deps: ConcreteSaveDeps): BadlyNamedSave =>
                    () => deps.logger.log();
            `,
            errors: [
                {
                    messageId: 'contractMustBeNamed',
                    data: { contractName: 'ConcreteSave', consumerName: 'createConcreteSave' },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                import type { MockUnmarkedService } from './eslint-local-rules/named-contracts/di/mocks/mockServiceContractExports';

                type ConcreteSaveDeps = { logger: { log: () => void } };

                const createConcreteSave = (deps: ConcreteSaveDeps): MockUnmarkedService =>
                    () => deps.logger.log();
            `,
            errors: [
                {
                    messageId: 'contractMustBeNamed',
                    data: { contractName: 'ConcreteSave', consumerName: 'createConcreteSave' },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                type ConcreteSaveDeps = { logger: { log: () => void } };

                const createConcreteSave = (deps: ConcreteSaveDeps): (() => void) =>
                    () => deps.logger.log();
            `,
            errors: [
                {
                    messageId: 'dependencyFactoryReturnType',
                    data: { factoryName: 'createConcreteSave' },
                },
            ],
        },
        {
            filename: namedContractsFilename,
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
            filename: namedContractsFilename,
            code: `
                type CreateSaveFactoryDeps = { logger: { log: () => void } };

                type SaveFactory = () => () => void;

                type CreateSaveDep = { createSave: SaveFactory };

                const createSaveFactory = (deps: CreateSaveFactoryDeps): SaveFactory =>
                    () => () => deps.logger.log();
            `,
            errors: [
                {
                    messageId: 'contractMustBeNamed',
                    data: {
                        contractName: 'SaveFactoryDep',
                        consumerName: 'SaveFactory',
                    },
                },
                {
                    messageId: 'serviceDependencyProperty',
                    data: {
                        serviceName: 'SaveFactory',
                        propertyName: 'saveFactory',
                    },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                type SaveFactoryDeps = { logger: { log: () => void } };

                type CreateSave = () => () => void;

                const createSaveFactory = (deps: SaveFactoryDeps): CreateSave =>
                    () => () => deps.logger.log();
            `,
            errors: [
                {
                    messageId: 'contractMustBeNamed',
                    data: { contractName: 'SaveFactory', consumerName: 'createSaveFactory' },
                },
                {
                    messageId: 'contractMustBeNamed',
                    data: {
                        contractName: 'CreateSaveFactoryDeps',
                        consumerName: 'createSaveFactory',
                    },
                },
            ],
        },
        {
            filename: namedContractsFilename,
            code: `
                type Save = () => void;

                type SaveDeps = { logger: { log: () => void } };

                const createSave = (deps: SaveDeps): Save => () => deps.logger.log();
            `,
            output: `
                type SaveDeps = { logger: { log: () => void } };

                type Save = () => void;

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
            filename: namedContractsFilename,
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
            filename: namedContractsFilename,
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
            filename: namedContractsFilename,
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
        {
            filename: namedContractsFilename,
            code: `
                type WrongDeps = { logger: { log: () => void } };

                /** @serviceContract */
                type AbstractSave = () => void;

                const createConcreteSave = (
                    deps: WrongDeps,
                ): AbstractSave => () => deps.logger.log();
            `,
            errors: [
                {
                    messageId: 'contractMustBeNamed',
                    data: {
                        contractName: 'ConcreteSaveDeps',
                        consumerName: 'createConcreteSave',
                    },
                },
            ],
        },
    ],
} as Parameters<typeof namedContractsRuleTester.run>[2]);
