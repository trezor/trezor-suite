import { nativeTheme } from 'electron';

import { type SuiteThemeVariant } from '@suite/desktop-app-api';

import { ipcMain } from '../ipcMain';
import type { ModuleInit } from './module';
import type { ILogger } from '../libs/logger';
import { Store } from '../libs/store';

type SetThemeManuallyParams = {
    theme: SuiteThemeVariant;
    store: Store;
    logger: ILogger;
};

const setThemeManually = ({ theme, store, logger }: SetThemeManuallyParams) => {
    logger.info('theme', `Manually setting app window UI to ${theme} theme.`);

    nativeTheme.themeSource = theme;
    store.setThemeSettings(theme);
};

export const SERVICE_NAME = 'theme';

export const init: ModuleInit = ({ mainWindowProxy, logger }) => {
    const store = Store.getStore();

    const theme = store.getThemeSettings();
    if (theme !== 'system') {
        logger.info(SERVICE_NAME, `Setting app window UI theme to ${theme}.`);
        nativeTheme.themeSource = theme;
    }

    ipcMain.on('theme/change', (_, newTheme) =>
        setThemeManually({ theme: newTheme, store, logger }),
    );

    nativeTheme.on('updated', () => {
        if (store.getThemeSettings() !== 'system') return;

        const newTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
        logger.info(SERVICE_NAME, `OS theme changed to ${newTheme}.`);
        mainWindowProxy.getInstance()?.webContents.send('theme/system-change', newTheme);
    });
};
