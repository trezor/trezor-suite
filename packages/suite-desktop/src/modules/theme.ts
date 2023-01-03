import { nativeTheme } from 'electron';

import { SuiteThemeVariant } from '@trezor/suite-desktop-api';

import { Store } from '../libs/store';
import { ipcMain } from '../typed-electron';

import type { Module } from './index';

const setThemeManually = (theme: SuiteThemeVariant, store: Store) => {
    const { logger } = global;

    logger.info('theme', `Manually setting app window UI to ${theme} theme.`);

    nativeTheme.themeSource = theme;
    store.setThemeSettings(theme);
};

export const init: Module = () => {
    const { logger } = global;

    const store = Store.getStore();

    const theme = store.getThemeSettings();
    if (theme !== 'system') {
        logger.info('theme', `Setting app window UI theme to ${theme}.`);
        nativeTheme.themeSource = theme;
    }

    ipcMain.on('theme/change', (_, newTheme) => setThemeManually(newTheme, store));
};
