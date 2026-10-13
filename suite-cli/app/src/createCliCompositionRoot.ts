import { createDownloadCryptoIcons, downloadVaultIcons } from '@suite-common/icons/scripts';

import { type CliAppDep, createCliApp } from './createCliApp';

export type CliCompositionRoot = CliAppDep;

export const createCliCompositionRoot = (): CliCompositionRoot => {
    const downloadCryptoIcons = createDownloadCryptoIcons({ downloadVaultIcons });
    const cliApp = createCliApp({ downloadCryptoIcons, downloadVaultIcons });

    return { cliApp };
};
