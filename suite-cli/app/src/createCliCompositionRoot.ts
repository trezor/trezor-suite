import { mkdir, writeFile } from 'fs/promises';

import { createDownloadCryptoIcons, createDownloadVaultIcons } from '@suite-common/icons/scripts';

import { type CliAppDep, createCliApp } from './createCliApp';

export type CliCompositionRoot = CliAppDep;

export const createCliCompositionRoot = (): CliCompositionRoot => {
    const downloadVaultIcons = createDownloadVaultIcons({ writeFile, mkdir });
    const downloadCryptoIcons = createDownloadCryptoIcons({ downloadVaultIcons, now: Date.now });
    const cliApp = createCliApp({ downloadCryptoIcons, downloadVaultIcons });

    return { cliApp };
};
