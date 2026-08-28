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
    ],
} as Parameters<typeof namedContractsRuleTester.run>[2]);
