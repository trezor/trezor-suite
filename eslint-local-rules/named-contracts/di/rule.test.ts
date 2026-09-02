import { enforceDiFactoryContractsRule } from './rule';
import { namedContractsFilename, namedContractsRuleTester } from '../testUtils';

namedContractsRuleTester.run('enforce-di-factory-contracts', enforceDiFactoryContractsRule, {
    valid: [
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

                type AbstractSave = () => void;

                // eslint-disable-next-line rule-to-test/enforce-di-factory-contracts -- Concrete implementation of the abstract AbstractSave contract.
                const createConcreteSave = (deps: ConcreteSaveDeps): AbstractSave =>
                    () => deps.logger.log();
            `,
        },
    ],
    invalid: [
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
                    data: {
                        contractName: 'SaveFactory',
                        consumerName: 'createSaveFactory',
                    },
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

                type AbstractSave = () => void;

                // eslint-disable-next-line rule-to-test/enforce-di-factory-contracts -- Concrete implementation of the abstract AbstractSave contract.
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
