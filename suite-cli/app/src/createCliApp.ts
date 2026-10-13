import type { DownloadCryptoIconsDep, DownloadVaultIconsDep } from '@suite-common/icons/scripts';

export type CliAppDeps = DownloadCryptoIconsDep & DownloadVaultIconsDep;

export type CliApp = (args: readonly string[]) => Promise<number>;

export type CliAppDep = { cliApp: CliApp };

export const createCliApp =
    (deps: CliAppDeps): CliApp =>
    async args => {
        switch (args[0]) {
            case 'download-crypto-icons':
                await deps.downloadCryptoIcons();

                return 0;
            case 'download-vault-icons':
                await deps.downloadVaultIcons();

                return 0;
            case undefined:
            case '--help':
            case 'help':
                // eslint-disable-next-line no-console -- CLI help output.
                console.log('Usage: yarn suite:cli <download-crypto-icons | download-vault-icons>');

                return 0;
            default:
                console.error(`Unknown CLI command: ${args[0]}. Use --help to list commands.`);

                return 1;
        }
    };
