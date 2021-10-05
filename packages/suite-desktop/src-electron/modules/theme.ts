import { nativeTheme, ipcMain } from 'electron';

import { SuiteThemeVariantOptions } from '@suite-types';
import { getThemeSettings, setThemeSettings } from '@desktop-electron/libs/store';

const setThemeManually = (theme: SuiteThemeVariantOptions) => {
    const { logger } = global;

    logger.info('theme', `Manually setting app window UI to ${theme} theme.`);

    nativeTheme.themeSource = theme;
    setThemeSettings(theme);
};

const init = () => {
    const { logger } = global;

    const theme = getThemeSettings();
    if (theme !== 'system') {
        logger.info('theme', `Setting app window UI theme to ${theme}.`);
        nativeTheme.themeSource = theme;
    }

    ipcMain.handle('theme/change', (_, theme: SuiteThemeVariantOptions) => {
        if (theme === 'light') {
            setThemeManually('light');
        } else {
            setThemeManually('dark');
        }
    });

    ipcMain.handle('theme/system', () => {
        setThemeManually('system');
    });
};

export default init;
