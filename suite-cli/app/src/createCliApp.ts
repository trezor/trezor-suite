import type { LoggerDep } from '@trezor/logger';

import type { CliCommand } from './CliCommand';

export type CliAppDeps = LoggerDep & { commands: readonly CliCommand[] };

export type CliApp = (args: readonly string[]) => Promise<number>;

export type CliAppDep = { cliApp: CliApp };

export const createCliApp = (deps: CliAppDeps): CliApp => {
    const commands = new Map(deps.commands.map(command => [command.name, command]));

    return async args => {
        const commandName = args[0];

        if (commandName === undefined || commandName === '--help' || commandName === 'help') {
            const commandList = [...commands.keys()].map(name => `  ${name}`).join('\n');

            deps.logger.log(`Usage: yarn suite:cli <command>\n\nCommands:\n${commandList}`);

            return 0;
        }

        const command = commands.get(commandName);
        if (!command) {
            deps.logger.error(`Unknown CLI command: ${commandName}. Use --help to list commands.`);

            return 1;
        }

        await command.exec(args.slice(1));

        return 0;
    };
};
